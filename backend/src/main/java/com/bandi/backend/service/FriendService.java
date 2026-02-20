package com.bandi.backend.service;

import com.bandi.backend.entity.member.GroupFriend;
import com.bandi.backend.entity.member.User;
import com.bandi.backend.entity.common.CmAttachment;
import com.bandi.backend.repository.GroupFriendRepository;
import com.bandi.backend.repository.UserRepository;
import com.bandi.backend.repository.CmAttachmentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FriendService {

    private final UserRepository userRepository;
    private final GroupFriendRepository groupFriendRepository;
    private final com.bandi.backend.repository.ChatRoomRepository chatRoomRepository;
    private final ChatService chatService;
    private final CmAttachmentRepository cmAttachmentRepository;

    public List<com.bandi.backend.dto.FriendResponseDto> searchFriend(String keyword, String userId) {
        List<User> users = userRepository.searchUsersExcludeSelf(keyword, userId);
        return users.stream()
                .map(user -> {
                    String profileUrl = null;
                    if (user.getAttachNo() != null) {
                        CmAttachment attachment = cmAttachmentRepository.findById(user.getAttachNo()).orElse(null);
                        if (attachment != null) {
                            profileUrl = attachment.getFilePath();
                        }
                    }

                    return com.bandi.backend.dto.FriendResponseDto.builder()
                            .userId(user.getUserId())
                            .userNm(user.getUserNm())
                            .userNickNm(user.getUserNickNm())
                            .profileUrl(profileUrl)
                            .unreadCount(0L) // Unused for basic search display
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void addFriend(String userId, String friendUserId) {
        if (userId.equals(friendUserId)) {
            throw new IllegalArgumentException("자기 자신에게 친구 요청을 보낼 수 없습니다.");
        }

        // Case 1: 내가 상대방에게 받은 요청이 있는지, 또는 상대방과 이미 친구인지 확인 (상대방 -> 나)
        com.bandi.backend.entity.member.GroupFriendId id1 = new com.bandi.backend.entity.member.GroupFriendId();
        id1.setUserId(friendUserId);
        id1.setFriendUserId(userId);

        if (groupFriendRepository.existsById(id1)) {
            throw new IllegalStateException("이미 친구이거나 요청 중입니다.");
        }

        // Case 2: 내가 상대방에게 이미 요청을 보냈는지 확인 (나 -> 상대방)
        com.bandi.backend.entity.member.GroupFriendId id2 = new com.bandi.backend.entity.member.GroupFriendId();
        id2.setUserId(userId);
        id2.setFriendUserId(friendUserId);

        if (groupFriendRepository.existsById(id2)) {
            throw new IllegalStateException("이미 친구이거나 요청 중입니다.");
        }

        GroupFriend groupFriend = new GroupFriend();
        groupFriend.setUserId(friendUserId); // 친구 요청을 받은 사람
        groupFriend.setFriendUserId(userId); // 친구 요청을 한 사람 (로그인한 사람)
        groupFriend.setFriendStatCd("R"); // 기본값 'R'

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));
        groupFriend.setInsDtime(now);
        groupFriend.setInsId(userId);
        groupFriend.setUpdDtime(now);
        groupFriend.setUpdId(userId);

        groupFriendRepository.save(groupFriend);
    }

    @Transactional(readOnly = true)
    public List<com.bandi.backend.dto.FriendResponseDto> getNewFriends(String userId) {
        // 받은 요청만 조회 (나에게 요청한 사람들) -> userId가 '나'인 경우?
        // 친구 요청의 경우:
        // 요청자(friendUserId) -> 대상자(userId) : friendStatCd = 'R'
        // 따라서 userId = '나' 이고 friendStatCd = 'R' 인 데이터를 찾으면 됨. (기존 로직 유지)
        List<GroupFriend> requests = groupFriendRepository.findByUserIdAndFriendStatCd(userId, "R");
        return convertToDtoList(requests, userId);
    }

    @Transactional(readOnly = true)
    public List<com.bandi.backend.dto.FriendResponseDto> getFriends(String userId) {
        // (userId = '나' OR friendUserId = '나') AND friendStatCd = 'A'
        List<GroupFriend> friends = groupFriendRepository.findFriends(userId, "A");
        return convertToDtoList(friends, userId);
    }

    private List<com.bandi.backend.dto.FriendResponseDto> convertToDtoList(List<GroupFriend> groupFriends,
            String myUserId) {
        // 친구의 ID를 추출 (내가 userId면 friendUserId가 친구, 내가 friendUserId면 userId가 친구)
        List<String> friendUserIds = groupFriends.stream()
                .map(gf -> {
                    if (gf.getUserId().equals(myUserId)) {
                        return gf.getFriendUserId();
                    } else {
                        return gf.getUserId();
                    }
                })
                .collect(java.util.stream.Collectors.toList());

        if (friendUserIds.isEmpty()) {
            return new java.util.ArrayList<>();
        }

        List<User> users = userRepository.findByUserIdIn(friendUserIds);

        return users.stream()
                .map(user -> {
                    String profileUrl = null;
                    if (user.getAttachNo() != null) {
                        CmAttachment attachment = cmAttachmentRepository.findById(user.getAttachNo()).orElse(null);
                        if (attachment != null) {
                            profileUrl = attachment.getFilePath();
                        }
                    }

                    return com.bandi.backend.dto.FriendResponseDto.builder()
                            .userId(user.getUserId())
                            .userNm(user.getUserNm())
                            .userNickNm(user.getUserNickNm())
                            .profileUrl(profileUrl)
                            .unreadCount(chatService.getUnreadMessageCount(myUserId, user.getUserId()))
                            .build();
                })
                .collect(java.util.stream.Collectors.toList());
    }

    @Transactional
    public void acceptFriend(String userId, String friendUserId) {
        // userId: 수락하는 사람 (나), friendUserId: 요청한 사람 (상대방)
        // GroupFriend 테이블의 user_id(나)와 friend_user_id(상대방) 조건에 만족하는 건을 'A'로 업데이트
        com.bandi.backend.entity.member.GroupFriendId id = new com.bandi.backend.entity.member.GroupFriendId();
        id.setUserId(userId);
        id.setFriendUserId(friendUserId);

        GroupFriend groupFriend = groupFriendRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청을 찾을 수 없습니다."));

        String now = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        groupFriend.setFriendStatCd("A");
        groupFriend.setUpdDtime(now);
        groupFriend.setUpdId(userId);

        // 1:1 채팅방 생성
        com.bandi.backend.entity.member.ChatRoom chatRoom = new com.bandi.backend.entity.member.ChatRoom();
        chatRoom.setUserId(userId); // 내 아이디
        chatRoom.setFriendUserId(friendUserId); // 친구 아이디
        chatRoom.setInsDtime(now);
        chatRoom.setInsId(userId); // 로그인한 아이디 (나)
        chatRoom.setUpdDtime(now);
        chatRoom.setUpdId(userId); // 로그인한 아이디 (나)

        chatRoomRepository.save(chatRoom);
    }

    @Transactional
    public void rejectFriend(String userId, String friendUserId) {
        // userId: 거절하는 사람 (나), friendUserId: 요청한 사람 (상대방)
        com.bandi.backend.entity.member.GroupFriendId id = new com.bandi.backend.entity.member.GroupFriendId();
        id.setUserId(userId);
        id.setFriendUserId(friendUserId);

        GroupFriend groupFriend = groupFriendRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("친구 요청을 찾을 수 없습니다."));

        if ("R".equals(groupFriend.getFriendStatCd())) {
            groupFriendRepository.delete(groupFriend);
        } else {
            throw new IllegalStateException("삭제할 수 없는 상태입니다.");
        }
    }
}
