package com.bandi.backend.service;

import com.bandi.backend.dto.ChatMessageDto;
import com.bandi.backend.dto.ChatMessageCreateDto;
import com.bandi.backend.dto.ChatRoomListDto;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import java.util.ArrayList;
import java.util.List;
import lombok.extern.slf4j.Slf4j;

@Service
@Transactional(readOnly = true)
@lombok.RequiredArgsConstructor
@Slf4j
public class JamChatService {

    @PersistenceContext
    private EntityManager entityManager;

    private final com.bandi.backend.repository.BandChatMessageRepository bandChatMessageRepository;
    private final com.bandi.backend.repository.CmAttachmentRepository cmAttachmentRepository;

    public ChatRoomListDto getChatRoomInfo(Long roomNo) {
        String sql = """
                SELECT
                    CNR.BN_NO        AS ROOM_NO,
                    CNR.BN_ROOM_NM   AS ROOM_NM,
                    'BAND'           AS ROOM_TYPE,
                    NULL             AS ATTACH_FILE_PATH
                FROM
                    BN_CHAT_ROOM CNR
                WHERE
                    CNR.BN_NO = :roomNo
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("roomNo", roomNo);

        try {
            Object result = query.getSingleResult();
            Object[] row = (Object[]) result;
            return ChatRoomListDto.builder()
                    .roomNo(((Number) row[0]).longValue())
                    .roomNm((String) row[1])
                    .roomType((String) row[2])
                    .attachFilePath((String) row[3])
                    .build();
        } catch (jakarta.persistence.NoResultException e) {
            return null;
        }
    }

    @Transactional
    public List<ChatMessageDto> getChatMessages(Long roomNo, String userId, Long lastMsgNo) {
        StringBuilder sql = new StringBuilder();

        sql.append(
                """
                            SELECT
                                MSG.BN_CHAT_MSG_NO,
                                MSG.BN_NO,
                                MSG.BN_CHAT_SND_USER_ID,
                                USR.USER_NICK_NM,
                                MSG.BN_CHAT_MSG,
                                MSG.BN_CHAT_MSG_TYPE_CD,
                                MSG.BN_CHAT_SND_DTIME,
                                (SELECT CMA2.FILE_PATH FROM CM_ATTACHMENT CMA2 WHERE CMA2.ATTACH_NO = USR.ATTACH_NO) AS PROFILE_URL,
                                (
                                    (SELECT COUNT(1) FROM BN_USER WHERE BN_NO = MSG.BN_NO AND BN_USER_STAT_CD = 'A')
                                    -
                                    (SELECT COUNT(1) FROM BN_CHAT_MESSAGE_READ WHERE BN_CHAT_MSG_NO = MSG.BN_CHAT_MSG_NO)
                                ) AS UNREAD_CNT,
                                MSG.ATTACH_NO,
                                CMA.FILE_PATH AS ATTACH_FILE_PATH,
                                CMA.FILE_NAME AS ATTACH_FILE_NM,
                                MSG.PARENT_MSG_NO,
                                P_MSG.BN_CHAT_MSG AS PARENT_MSG_CONTENT,
                                P_USR.USER_NICK_NM AS PARENT_MSG_NICK
                            FROM BN_CHAT_MESSAGE MSG
                            LEFT JOIN MM_USER USR ON USR.USER_ID = MSG.BN_CHAT_SND_USER_ID
                            LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = MSG.ATTACH_NO AND MSG.BN_CHAT_MSG_TYPE_CD != 'VOTE'
                            LEFT JOIN BN_CHAT_MESSAGE P_MSG ON P_MSG.BN_CHAT_MSG_NO = MSG.PARENT_MSG_NO
                            LEFT JOIN MM_USER P_USR ON P_USR.USER_ID = P_MSG.BN_CHAT_SND_USER_ID
                            WHERE MSG.BN_NO = :roomNo
                            AND MSG.BN_CHAT_STAT_CD = 'A'
                        """);

        if (lastMsgNo != null) {
            sql.append(" AND MSG.BN_CHAT_MSG_NO < :lastMsgNo ");
        }

        sql.append(" ORDER BY MSG.BN_CHAT_MSG_NO DESC LIMIT 30 ");

        Query query = entityManager.createNativeQuery(sql.toString());
        query.setParameter("roomNo", roomNo);
        if (lastMsgNo != null) {
            query.setParameter("lastMsgNo", lastMsgNo);
        }

        List<Object[]> results = query.getResultList();
        List<ChatMessageDto> messages = new ArrayList<>();
        String currentDateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        for (Object[] row : results) {
            String senderId = (String) row[2];
            Long msgNo = ((Number) row[0]).longValue();
            int unreadCnt = ((Number) row[8]).intValue();
            Long attachNo = row[9] != null ? ((Number) row[9]).longValue() : null;
            String attachFilePath = (String) row[10];
            String attachFileNm = (String) row[11];
            Long parentMsgNo = row[12] != null ? ((Number) row[12]).longValue() : null;
            String parentMsgContent = (String) row[13];
            String parentMsgUserNickNm = (String) row[14];

            ChatMessageDto dto = ChatMessageDto.builder()
                    .cnMsgNo(msgNo)
                    .cnNo(((Number) row[1]).longValue())
                    .sndUserId(senderId)
                    .userNickNm((String) row[3])
                    .msg((String) row[4])
                    .msgTypeCd((String) row[5])
                    .sndDtime((String) row[6])
                    .userProfileUrl((String) row[7])
                    .isMyMessage(senderId.equals(userId))
                    .unreadCount(unreadCnt < 0 ? 0 : unreadCnt)
                    .attachNo(attachNo)
                    .attachFilePath(attachFilePath)
                    .attachFileName(attachFileNm)
                    .voteNo(null)
                    .parentMsgNo(parentMsgNo)
                    .parentMsgContent(parentMsgContent)
                    .parentMsgUserNickNm(parentMsgUserNickNm)
                    .build();
            messages.add(dto);

            // Mark as read if not my message
            if (!senderId.equals(userId)) {
                try {
                    entityManager.createNativeQuery(
                            "INSERT INTO BN_CHAT_MESSAGE_READ (BN_CHAT_MSG_NO, BN_CHAT_READ_USER_ID, BN_CHAT_READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (BN_CHAT_MSG_NO, BN_CHAT_READ_USER_ID) DO NOTHING")
                            .setParameter("msgNo", msgNo)
                            .setParameter("userId", userId)
                            .setParameter("readDtime", currentDateTime)
                            .executeUpdate();
                } catch (Exception e) {
                    // Ignore unique constraint violation or multiple reads
                }
            }
        }
        return messages;
    }

    @Transactional
    public ChatMessageDto saveMessage(ChatMessageCreateDto dto) {
        log.info("Saving Jam Chat message: {}", dto);
        String currentDateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        com.bandi.backend.entity.band.BandChatMessage message = new com.bandi.backend.entity.band.BandChatMessage();
        message.setBnNo(dto.getCnNo()); // Using cnNo as roomNo from DTO
        message.setSndUserId(dto.getSndUserId());
        message.setMsg(dto.getMsg());
        message.setMsgTypeCd(dto.getMsgTypeCd() != null ? dto.getMsgTypeCd() : "TEXT");
        message.setAttachNo(dto.getAttachNo());
        message.setSndDtime(currentDateTime);
        message.setChatStatCd("A");
        message.setInsDtime(currentDateTime);
        message.setUpdDtime(currentDateTime);
        message.setParentMsgNo(dto.getParentMsgNo());

        com.bandi.backend.entity.band.BandChatMessage savedMessage = bandChatMessageRepository.save(message);
        log.info("Message saved with ID: {}", savedMessage.getBnMsgNo());

        // Mark sender as read
        try {
            // Updated to insert into BN_CHAT_MESSAGE_READ only
            entityManager.createNativeQuery(
                    "INSERT INTO BN_CHAT_MESSAGE_READ (BN_CHAT_MSG_NO, BN_CHAT_READ_USER_ID, BN_CHAT_READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (BN_CHAT_MSG_NO, BN_CHAT_READ_USER_ID) DO NOTHING")
                    .setParameter("msgNo", savedMessage.getBnMsgNo())
                    .setParameter("userId", dto.getSndUserId())
                    .setParameter("readDtime", currentDateTime)
                    .executeUpdate();
        } catch (Exception e) {
            log.error("ERROR in saveMessage (INSERT READ)", e);
        }

        String userNickNm = "Unknown";
        String userProfileUrl = null;

        try {
            Query query = entityManager.createNativeQuery(
                    "SELECT USER_NICK_NM FROM MM_USER WHERE USER_ID = :userId");
            query.setParameter("userId", dto.getSndUserId());
            Object result = query.getSingleResult();
            if (result != null) {
                userNickNm = (String) result;
            }
        } catch (Exception e) {
            log.error("ERROR in saveMessage (SELECT USER)", e);
            // Ignore
        }

        int unreadCount = 0;
        try {
            Query countQuery = entityManager.createNativeQuery(
                    "SELECT COUNT(1) FROM BN_USER WHERE BN_NO = :roomNo AND BN_USER_STAT_CD = 'A'");
            countQuery.setParameter("roomNo", dto.getCnNo());
            unreadCount = ((Number) countQuery.getSingleResult()).intValue();
            unreadCount = Math.max(0, unreadCount - 1);
        } catch (Exception e) {
            log.error("ERROR in saveMessage (SELECT BN_USER COUNT)", e);
        }

        String parentMsgContent = null;
        String parentMsgUserNickNm = null;

        if (savedMessage.getParentMsgNo() != null) {
            try {
                Query parentQuery = entityManager.createNativeQuery(
                        "SELECT M.BN_CHAT_MSG, U.USER_NICK_NM " +
                                "FROM BN_CHAT_MESSAGE M " +
                                "LEFT JOIN MM_USER U ON U.USER_ID = M.BN_CHAT_SND_USER_ID " +
                                "WHERE M.BN_CHAT_MSG_NO = :parentMsgNo");
                parentQuery.setParameter("parentMsgNo", savedMessage.getParentMsgNo());
                Object result = parentQuery.getSingleResult();

                if (result instanceof Object[]) {
                    Object[] parentResult = (Object[]) result;
                    parentMsgContent = (String) parentResult[0];
                    parentMsgUserNickNm = (String) parentResult[1];
                }

            } catch (Exception e) {
                log.error("ERROR in saveMessage (SELECT PARENT)", e);
            }
        }

        String attachFilePath = null;
        String attachFileName = null;
        if (savedMessage.getAttachNo() != null && !"VOTE".equals(savedMessage.getMsgTypeCd())) {
            com.bandi.backend.entity.common.CmAttachment attachment = cmAttachmentRepository
                    .findById(savedMessage.getAttachNo()).orElse(null);
            if (attachment != null) {
                attachFilePath = attachment.getFilePath();
                attachFileName = attachment.getFileName();
            }
        }

        return ChatMessageDto.builder()
                .cnMsgNo(savedMessage.getBnMsgNo())
                .cnNo(savedMessage.getBnNo())
                .sndUserId(savedMessage.getSndUserId())
                .userNickNm(userNickNm)
                .msg(savedMessage.getMsg())
                .msgTypeCd(savedMessage.getMsgTypeCd())
                .sndDtime(savedMessage.getSndDtime())
                .userProfileUrl(userProfileUrl)
                .isMyMessage(true)
                .unreadCount(unreadCount)
                .parentMsgNo(savedMessage.getParentMsgNo())
                .parentMsgContent(parentMsgContent)
                .parentMsgUserNickNm(parentMsgUserNickNm)
                .attachNo(savedMessage.getAttachNo())
                .attachFilePath(attachFilePath)
                .attachFileName(attachFileName)
                .build();
    }

    @Transactional
    public List<com.bandi.backend.dto.FriendResponseDto> getChatRoomUsers(Long roomNo) {
        String sql = """
                SELECT
                    U.USER_ID,
                    U.USER_NM,
                    U.USER_NICK_NM,
                    CMA.FILE_PATH
                FROM BN_USER BU
                JOIN MM_USER U ON U.USER_ID = BU.BN_USER_ID
                LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = U.ATTACH_NO
                WHERE BU.BN_NO = :roomNo
                AND BU.BN_USER_STAT_CD = 'A'
                """;

        Query query = entityManager.createNativeQuery(sql);
        query.setParameter("roomNo", roomNo);

        List<Object[]> results = query.getResultList();
        List<com.bandi.backend.dto.FriendResponseDto> users = new ArrayList<>();

        for (Object[] row : results) {
            com.bandi.backend.dto.FriendResponseDto dto = com.bandi.backend.dto.FriendResponseDto.builder()
                    .userId((String) row[0])
                    .userNm((String) row[1])
                    .userNickNm((String) row[2])
                    .profileUrl((String) row[3])
                    .build();
            users.add(dto);
        }
        return users;
    }

    @Transactional
    public java.util.Map<String, Object> uploadChatFile(org.springframework.web.multipart.MultipartFile file,
            String userId) {
        if (file == null || file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }

        String currentDateTime = java.time.LocalDateTime.now()
                .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

        try {
            String uploadDir = "d:/Project/bandi/frontend-web/public/common_images";
            java.io.File dir = new java.io.File(uploadDir);
            if (!dir.exists()) {
                dir.mkdirs();
            }

            String originalFileName = file.getOriginalFilename();
            String extension = "";
            if (originalFileName != null && originalFileName.contains(".")) {
                extension = originalFileName.substring(originalFileName.lastIndexOf("."));
            }
            String savedFileName = java.util.UUID.randomUUID().toString() + extension;
            java.io.File dest = new java.io.File(dir, savedFileName);
            file.transferTo(dest);

            com.bandi.backend.entity.common.CmAttachment attachment = new com.bandi.backend.entity.common.CmAttachment();
            attachment.setFileName(originalFileName);
            attachment.setFilePath("/common_images/" + savedFileName);
            attachment.setFileSize(file.getSize());
            attachment.setMimeType(file.getContentType());
            attachment.setInsDtime(currentDateTime);
            attachment.setInsId(userId);
            attachment.setUpdDtime(currentDateTime);
            attachment.setUpdId(userId);

            com.bandi.backend.entity.common.CmAttachment savedAttachment = cmAttachmentRepository.save(attachment);

            return java.util.Map.of(
                    "attachNo", savedAttachment.getAttachNo(),
                    "filePath", savedAttachment.getFilePath(),
                    "fileName", savedAttachment.getFileName());

        } catch (java.io.IOException e) {
            throw new RuntimeException("Failed to store file", e);
        }
    }
}
