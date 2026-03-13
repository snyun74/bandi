package com.bandi.backend.service;

import com.bandi.backend.dto.GroupChatCreateDto;
import com.bandi.backend.dto.GroupChatMemberDto;
import com.bandi.backend.entity.cm.CmGrpChatRoom;
import com.bandi.backend.entity.cm.CmGrpChatUser;
import com.bandi.backend.repository.CmGrpChatRoomRepository;
import com.bandi.backend.repository.CmGrpChatUserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.Query;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class GroupChatService {

    private final EntityManager entityManager;
    private final CmGrpChatRoomRepository cmGrpChatRoomRepository;
    private final CmGrpChatUserRepository cmGrpChatUserRepository;

    public List<GroupChatMemberDto> getEligibleMembers(String userId) {
        List<GroupChatMemberDto> eligibleMembers = new ArrayList<>();
        Set<String> addedUserIds = new HashSet<>();

        // Add Friends
        String friendSql = """
                    SELECT U.USER_ID, U.USER_NICK_NM, CMA.FILE_PATH
                    FROM MM_GROUP_FRIEND F
                    JOIN MM_USER U ON U.USER_ID = CASE WHEN F.USER_ID = :userId THEN F.FRIEND_USER_ID ELSE F.USER_ID END
                    LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = U.ATTACH_NO
                    WHERE (F.USER_ID = :userId OR F.FRIEND_USER_ID = :userId) AND F.FRIEND_STAT_CD = 'A'
                """;
        List<Object[]> friendResults = entityManager.createNativeQuery(friendSql)
                .setParameter("userId", userId)
                .getResultList();

        for (Object[] row : friendResults) {
            String fUserId = (String) row[0];
            if (!addedUserIds.contains(fUserId) && !fUserId.equals(userId)) {
                eligibleMembers.add(GroupChatMemberDto.builder()
                        .userId(fUserId)
                        .userNickNm((String) row[1])
                        .profileUrl((String) row[2])
                        .memberType("FRIEND")
                        .build());
                addedUserIds.add(fUserId);
            }
        }

        // Add Clan Members in active/confirmed clans where user is a member
        String clanSql = """
                    SELECT DISTINCT U.USER_ID, U.USER_NICK_NM, CMA.FILE_PATH
                    FROM CN_USER CU
                    JOIN CN_USER CU_PEER ON CU.CN_NO = CU_PEER.CN_NO
                    JOIN MM_USER U ON U.USER_ID = CU_PEER.CN_USER_ID
                    JOIN CN_GROUP CG ON CG.CN_NO = CU.CN_NO
                    LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = U.ATTACH_NO
                    WHERE CU.CN_USER_ID = :userId
                      AND CU.CN_USER_STAT_CD = 'A' AND CU.CN_USER_APPR_STAT_CD = 'CN'
                      AND CU_PEER.CN_USER_STAT_CD = 'A' AND CU_PEER.CN_USER_APPR_STAT_CD = 'CN'
                      AND CG.CN_STAT_CD = 'A' AND CG.CN_APPR_STAT_CD = 'CN'
                """;
        List<Object[]> clanResults = entityManager.createNativeQuery(clanSql)
                .setParameter("userId", userId)
                .getResultList();

        for (Object[] row : clanResults) {
            String cUserId = (String) row[0];
            if (!addedUserIds.contains(cUserId) && !cUserId.equals(userId)) {
                eligibleMembers.add(GroupChatMemberDto.builder()
                        .userId(cUserId)
                        .userNickNm((String) row[1])
                        .profileUrl((String) row[2])
                        .memberType("CLAN")
                        .build());
                addedUserIds.add(cUserId);
            }
        }

        // Add Band/Jam room members in active/confirmed bands where user is a member
        String bandSql = """
                    SELECT DISTINCT U.USER_ID, U.USER_NICK_NM, CMA.FILE_PATH
                    FROM BN_USER BU
                    JOIN BN_USER BU_PEER ON BU.BN_NO = BU_PEER.BN_NO
                    JOIN MM_USER U ON U.USER_ID = BU_PEER.BN_USER_ID
                    JOIN BN_GROUP BG ON BG.BN_NO = BU.BN_NO
                    LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = U.ATTACH_NO
                    WHERE BU.BN_USER_ID = :userId
                      AND BU.BN_USER_STAT_CD = 'A'
                      AND BU_PEER.BN_USER_STAT_CD = 'A'
                      AND BG.BN_STAT_CD = 'A' AND BG.BN_CONF_FG IN ('N', 'Y')
                """;
        List<Object[]> bandResults = entityManager.createNativeQuery(bandSql)
                .setParameter("userId", userId)
                .getResultList();

        for (Object[] row : bandResults) {
            String bUserId = (String) row[0];
            if (!addedUserIds.contains(bUserId) && !bUserId.equals(userId)) {
                eligibleMembers.add(GroupChatMemberDto.builder()
                        .userId(bUserId)
                        .userNickNm((String) row[1])
                        .profileUrl((String) row[2])
                        .memberType("BAND")
                        .build());
                addedUserIds.add(bUserId);
            }
        }

        return eligibleMembers;
    }

    @Transactional
    public Long createGroupChat(String userId, GroupChatCreateDto dto) {
        String currentDateTime = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        // 1. Create CM_GRP_CHAT_ROOM
        CmGrpChatRoom room = new CmGrpChatRoom();
        room.setGrpChatRoomNm(dto.getRoomNm());
        room.setInsDtime(currentDateTime);
        room.setInsId(userId);
        room.setUpdDtime(currentDateTime);
        room.setUpdId(userId);
        CmGrpChatRoom savedRoom = cmGrpChatRoomRepository.save(room);

        Long roomNo = savedRoom.getGrpChatNo();

        // 2. Add creator to CM_GRP_CHAT_USER
        CmGrpChatUser creator = new CmGrpChatUser();
        creator.setGrpChatNo(roomNo);
        creator.setUserId(userId);
        creator.setInsDtime(currentDateTime);
        creator.setInsId(userId);
        creator.setUpdDtime(currentDateTime);
        creator.setUpdId(userId);
        cmGrpChatUserRepository.save(creator);

        // 3. Add other users to CM_GRP_CHAT_USER
        if (dto.getUserIds() != null) {
            for (String inviteeId : dto.getUserIds()) {
                if (inviteeId.equals(userId))
                    continue; // ignore self if passed
                CmGrpChatUser u = new CmGrpChatUser();
                u.setGrpChatNo(roomNo);
                u.setUserId(inviteeId);
                u.setInsDtime(currentDateTime);
                u.setInsId(userId);
                u.setUpdDtime(currentDateTime);
                u.setUpdId(userId);
                cmGrpChatUserRepository.save(u);
            }
        }

        return roomNo;
    }

    public List<GroupChatMemberDto> getRoomMembers(Long roomNo) {
        String sql = """
            SELECT U.USER_ID, U.USER_NICK_NM, CMA.FILE_PATH
            FROM CM_GRP_CHAT_USER CGU
            JOIN MM_USER U ON U.USER_ID = CGU.USER_ID
            LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = U.ATTACH_NO
            WHERE CGU.GRP_CHAT_NO = :roomNo
            ORDER BY U.USER_NICK_NM ASC
        """;
        
        List<Object[]> results = entityManager.createNativeQuery(sql)
                .setParameter("roomNo", roomNo)
                .getResultList();
                
        List<GroupChatMemberDto> members = new ArrayList<>();
        for (Object[] row : results) {
            members.add(GroupChatMemberDto.builder()
                    .userId((String) row[0])
                    .userNickNm((String) row[1])
                    .profileUrl((String) row[2])
                    .memberType("GROUP")
                    .build());
        }
        return members;
    }

    @Transactional
    public void leaveRoom(Long roomNo, String userId) {
        com.bandi.backend.entity.cm.CmGrpChatUserId id = new com.bandi.backend.entity.cm.CmGrpChatUserId(roomNo, userId);
        cmGrpChatUserRepository.deleteById(id);
    }
}
