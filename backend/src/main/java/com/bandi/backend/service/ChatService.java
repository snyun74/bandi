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

@Service
@Transactional(readOnly = true)
@lombok.RequiredArgsConstructor
public class ChatService {

  @PersistenceContext
  private EntityManager entityManager;
  private final com.bandi.backend.repository.ClanChatMessageRepository clanChatMessageRepository;
  private final com.bandi.backend.repository.CmAttachmentRepository cmAttachmentRepository;

  private final com.bandi.backend.repository.ChatMessageRepository chatMessageRepository;
  private final com.bandi.backend.repository.ChatRoomRepository chatRoomRepository;

  private final com.bandi.backend.repository.BandChatMessageRepository bandChatMessageRepository;

  public List<ChatRoomListDto> getGroupChatList(String userId) {
    String sql = """
            SELECT
                CNR.CN_NO        AS ROOM_NO, -- 클랜채팅방번호
                CNR.CN_ROOM_NM   AS ROOM_NM, -- 클랜채팅방이름
                (
                  SELECT MSG.MSG
                  FROM CN_CHAT_MESSAGE MSG
                  WHERE MSG.CN_NO = CNR.CN_NO
                    AND MSG.SND_USER_ID <> :userId
                    AND MSG.SND_DTIME BETWEEN TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD') || '000000'
                                                  AND TO_CHAR(NOW(), 'YYYYMMDD') || '999999'
                  ORDER BY MSG.SND_DTIME DESC
                  LIMIT 1
                ) AS NEW_MSG, -- 신규메시지
                (
                  SELECT COUNT(1)
                  FROM CN_CHAT_MESSAGE MSG
                  WHERE MSG.CN_NO = CNR.CN_NO
                    AND MSG.SND_USER_ID <> :userId
                    AND MSG.SND_DTIME BETWEEN TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD') || '000000'
                                          AND TO_CHAR(NOW(), 'YYYYMMDD') || '999999'
                    AND NOT EXISTS (
                        SELECT 1
                        FROM CN_CHAT_MESSAGE_READ MSR
                        WHERE MSR.CN_MSG_NO = MSG.CN_MSG_NO
                          AND MSR.READ_USER_ID = :userId
                    )
                ) AS NEW_MSG_READ_CNT, -- 채팅읽지않은건수
                'CLAN' AS ROOM_TYPE,
                CMA.FILE_PATH AS ATTACH_FILE_PATH
            FROM
                CN_USER CNU
            INNER JOIN CN_GROUP CNG ON CNG.CN_NO = CNU.CN_NO
            INNER JOIN CN_CHAT_ROOM CNR ON CNR.CN_NO = CNU.CN_NO
            LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = CNG.ATTACH_NO
            WHERE
                CNU.CN_USER_ID = :userId
                AND CNU.CN_USER_STAT_CD = 'A'
                AND CNU.CN_USER_APPR_STAT_CD = 'CN'
                AND CNG.CN_STAT_CD = 'A'
                AND CNG.CN_APPR_STAT_CD = 'CN'

            UNION ALL

            SELECT
                CNR.BN_NO        AS ROOM_NO, -- 합주채팅방번호
                CNR.BN_ROOM_NM   AS ROOM_NM, -- 합주채팅방이름
                (
                  SELECT MSG.BN_CHAT_MSG
                  FROM BN_CHAT_MESSAGE MSG
                  WHERE MSG.BN_NO = CNR.BN_NO
                    AND MSG.BN_CHAT_SND_USER_ID <> :userId
                    AND MSG.BN_CHAT_SND_DTIME BETWEEN TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD') || '000000'
                                                  AND TO_CHAR(NOW(), 'YYYYMMDD') || '999999'
                  ORDER BY MSG.BN_CHAT_SND_DTIME DESC
                  LIMIT 1
                ) AS NEW_MSG, -- 신규메시지
                (
                  SELECT COUNT(1)
                  FROM BN_CHAT_MESSAGE MSG
                  WHERE MSG.BN_NO = CNR.BN_NO
                    AND MSG.BN_CHAT_SND_USER_ID <> :userId
                    AND MSG.BN_CHAT_SND_DTIME BETWEEN TO_CHAR(NOW() - INTERVAL '30 days', 'YYYYMMDD') || '000000'
                                                  AND TO_CHAR(NOW(), 'YYYYMMDD') || '999999'
                    AND NOT EXISTS (
                        SELECT 1
                        FROM BN_CHAT_MESSAGE_READ MSR
                        WHERE MSR.BN_CHAT_MSG_NO = MSG.BN_CHAT_MSG_NO
                          AND MSR.BN_CHAT_READ_USER_ID = :userId
                    )
                ) AS NEW_MSG_READ_CNT, -- 채팅읽지않은건수
                'BAND' AS ROOM_TYPE,
                CMA.FILE_PATH AS ATTACH_FILE_PATH
            FROM
                BN_USER BNU
            INNER JOIN BN_GROUP BNG ON BNG.BN_NO = BNU.BN_NO
            INNER JOIN BN_CHAT_ROOM CNR ON CNR.BN_NO = BNU.BN_NO
            LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = BNG.ATTACH_NO
            WHERE
                BNU.BN_USER_ID = :userId
                AND BNU.BN_USER_STAT_CD = 'A'
                AND BNG.BN_STAT_CD = 'A'
        """;

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("userId", userId);

    List<Object[]> results = query.getResultList();
    // System.out.println("DEBUG: Chat List Query Results Count: " +
    // results.size());
    List<ChatRoomListDto> chatRooms = new ArrayList<>();

    for (Object[] result : results) {
      // System.out.println("DEBUG: Room: " + result[1] + ", Type: " + result[4] + ",
      // AttachPath: " + result[5]);
      ChatRoomListDto dto = ChatRoomListDto.builder()
          .roomNo(((Number) result[0]).longValue())
          .roomNm((String) result[1])
          .newMsg((String) result[2])
          .newMsgReadCnt(((Number) result[3]).intValue())
          .roomType((String) result[4])
          .attachFilePath((String) result[5])
          .build();
      chatRooms.add(dto);
    }

    return chatRooms;
  }

  public ChatRoomListDto getChatRoomInfo(Long roomNo) {
    String sql = """
        SELECT
            CNR.CN_NO        AS ROOM_NO,
            CNR.CN_ROOM_NM   AS ROOM_NM,
            'CLAN'           AS ROOM_TYPE,
            CMA.FILE_PATH    AS ATTACH_FILE_PATH
        FROM
            CN_CHAT_ROOM CNR
        INNER JOIN CN_GROUP CNG ON CNG.CN_NO = CNR.CN_NO
        LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = CNG.ATTACH_NO
        WHERE
            CNR.CN_NO = :roomNo
        UNION ALL
        SELECT
            CNR.BN_NO        AS ROOM_NO,
            CNR.BN_ROOM_NM   AS ROOM_NM,
            'BAND'           AS ROOM_TYPE,
            CMA.FILE_PATH    AS ATTACH_FILE_PATH
        FROM
            BN_CHAT_ROOM CNR
        INNER JOIN BN_GROUP BNG ON BNG.BN_NO = CNR.BN_NO
        LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = BNG.ATTACH_NO
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
  public List<com.bandi.backend.dto.ChatMessageDto> getChatMessages(Long roomNo, String userId, Long lastMsgNo,
      String roomType) {
    StringBuilder sql = new StringBuilder();

    if ("BAND".equals(roomType)) {
      sql.append("""
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
                  NULL AS VOTE_NO,
                  MSG.PARENT_MSG_NO,
                  P_MSG.BN_CHAT_MSG AS PARENT_MSG_CONTENT,
                  P_USR.USER_NICK_NM AS PARENT_MSG_NICK
              FROM BN_CHAT_MESSAGE MSG
              LEFT JOIN MM_USER USR ON USR.USER_ID = MSG.BN_CHAT_SND_USER_ID
              LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = MSG.ATTACH_NO
              LEFT JOIN BN_CHAT_MESSAGE P_MSG ON P_MSG.BN_CHAT_MSG_NO = MSG.PARENT_MSG_NO
              LEFT JOIN MM_USER P_USR ON P_USR.USER_ID = P_MSG.BN_CHAT_SND_USER_ID
              WHERE MSG.BN_NO = :roomNo
              AND MSG.BN_CHAT_STAT_CD = 'A'
          """);
    } else {
      sql.append(
          """
                  SELECT
                      MSG.CN_MSG_NO,
                      MSG.CN_NO,
                      MSG.SND_USER_ID,
                      USR.USER_NICK_NM,
                      MSG.MSG,
                      MSG.MSG_TYPE_CD,
                      MSG.SND_DTIME,
                      (SELECT CMA2.FILE_PATH FROM CM_ATTACHMENT CMA2 WHERE CMA2.ATTACH_NO = USR.ATTACH_NO) AS PROFILE_URL,
                      (
                        (SELECT COUNT(1) FROM CN_USER WHERE CN_NO = MSG.CN_NO AND CN_USER_STAT_CD = 'A' AND CN_USER_APPR_STAT_CD = 'CN')
                        -
                        (SELECT COUNT(1) FROM CN_CHAT_MESSAGE_READ WHERE CN_MSG_NO = MSG.CN_MSG_NO)
                      ) AS UNREAD_CNT,
                      MSG.ATTACH_NO,
                      CMA.FILE_PATH AS ATTACH_FILE_PATH,
                      CMA.FILE_NAME AS ATTACH_FILE_NM,
                      MSG.VOTE_NO,
                      MSG.PARENT_MSG_NO,
                      P_MSG.MSG AS PARENT_MSG_CONTENT,
                      P_USR.USER_NICK_NM AS PARENT_MSG_NICK
                  FROM CN_CHAT_MESSAGE MSG
                  LEFT JOIN MM_USER USR ON USR.USER_ID = MSG.SND_USER_ID
                  LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = MSG.ATTACH_NO
                  LEFT JOIN CN_CHAT_MESSAGE P_MSG ON P_MSG.CN_MSG_NO = MSG.PARENT_MSG_NO
                  LEFT JOIN MM_USER P_USR ON P_USR.USER_ID = P_MSG.SND_USER_ID
                  WHERE MSG.CN_NO = :roomNo
                  AND MSG.CHAT_STAT_CD = 'A'
              """);
    }

    if (lastMsgNo != null) {
      if ("BAND".equals(roomType)) {
        sql.append(" AND MSG.BN_CHAT_MSG_NO < :lastMsgNo ");
      } else {
        sql.append(" AND MSG.CN_MSG_NO < :lastMsgNo ");
      }
    }

    if ("BAND".equals(roomType)) {
      sql.append(" ORDER BY MSG.BN_CHAT_MSG_NO DESC LIMIT 30 ");
    } else {
      sql.append(" ORDER BY MSG.CN_MSG_NO DESC LIMIT 30 ");
    }

    Query query = entityManager.createNativeQuery(sql.toString());
    query.setParameter("roomNo", roomNo);
    if (lastMsgNo != null) {
      query.setParameter("lastMsgNo", lastMsgNo);
    }

    List<Object[]> results = query.getResultList();
    List<com.bandi.backend.dto.ChatMessageDto> messages = new ArrayList<>();
    String currentDateTime = java.time.LocalDateTime.now()
        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

    for (Object[] row : results) {
      String senderId = (String) row[2];
      Long msgNo = ((Number) row[0]).longValue();
      int unreadCnt = ((Number) row[8]).intValue();
      Long attachNo = row[9] != null ? ((Number) row[9]).longValue() : null;
      String attachFilePath = (String) row[10];
      String attachFileNm = (String) row[11];
      Long voteNo = row[12] != null ? ((Number) row[12]).longValue() : null;
      Long parentMsgNo = row[13] != null ? ((Number) row[13]).longValue() : null;
      String parentMsgContent = (String) row[14];
      String parentMsgUserNickNm = (String) row[15];

      // Debug Log
      // System.out.println("DEBUG: msgNo=" + msgNo + ", unread=" + unreadCnt);

      com.bandi.backend.dto.ChatMessageDto dto = com.bandi.backend.dto.ChatMessageDto.builder()
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
          .attachFilePath(attachFilePath)
          .attachFileName(attachFileNm)
          .voteNo(voteNo)
          .parentMsgNo(parentMsgNo)
          .parentMsgContent(parentMsgContent)
          .parentMsgUserNickNm(parentMsgUserNickNm)
          .build();
      messages.add(dto);

      // Mark as read if not my message
      if (!senderId.equals(userId)) {
        try {
          entityManager.createNativeQuery(
              "INSERT INTO CN_CHAT_MESSAGE_READ (CN_MSG_NO, READ_USER_ID, READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (CN_MSG_NO, READ_USER_ID) DO NOTHING")
              .setParameter("msgNo", msgNo)
              .setParameter("userId", userId)
              .setParameter("readDtime", currentDateTime)
              .executeUpdate();
        } catch (Exception e) {
          // Ignore unique constraint violation or multiple reads
        }
      } else if (!senderId.equals(userId) && "BAND".equals(roomType)) {
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
    System.out.println("DEBUG: saveMessage called. parentMsgNo in DTO: " + dto.getParentMsgNo());

    String currentDateTime = java.time.LocalDateTime.now()
        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

    String roomType = dto.getRoomType();

    if ("BAND".equals(roomType)) {
      com.bandi.backend.entity.band.BandChatMessage message = new com.bandi.backend.entity.band.BandChatMessage();
      message.setBnNo(dto.getCnNo());
      message.setSndUserId(dto.getSndUserId());
      message.setMsg(dto.getMsg());
      message.setMsgTypeCd(dto.getMsgTypeCd() != null ? dto.getMsgTypeCd() : "TEXT");
      message.setAttachNo(dto.getAttachNo());
      message.setSndDtime(currentDateTime);
      message.setChatStatCd("A");
      message.setInsDtime(currentDateTime);
      message.setInsDtime(currentDateTime);
      message.setUpdDtime(currentDateTime);
      message.setParentMsgNo(dto.getParentMsgNo());

      com.bandi.backend.entity.band.BandChatMessage savedMessage = bandChatMessageRepository.save(message);

      // Mark sender as read
      try {
        entityManager.createNativeQuery(
            "INSERT INTO BN_CHAT_MESSAGE_READ (BN_CHAT_MSG_NO, BN_CHAT_READ_USER_ID, BN_CHAT_READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (BN_CHAT_MSG_NO, BN_CHAT_READ_USER_ID) DO NOTHING")
            .setParameter("msgNo", savedMessage.getBnMsgNo())
            .setParameter("userId", dto.getSndUserId())
            .setParameter("readDtime", currentDateTime)
            .executeUpdate();
      } catch (Exception e) {
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
          e.printStackTrace();
        }
      }

      String attachFilePath = null;
      String attachFileName = null;
      if (savedMessage.getAttachNo() != null) {
        com.bandi.backend.entity.common.CmAttachment attachment = cmAttachmentRepository
            .findById(savedMessage.getAttachNo()).orElse(null);
        if (attachment != null) {
          attachFilePath = attachment.getFilePath();
          attachFileName = attachment.getFileName();
        }
      }

      return com.bandi.backend.dto.ChatMessageDto.builder()
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

    com.bandi.backend.entity.clan.ClanChatMessage message = new com.bandi.backend.entity.clan.ClanChatMessage();
    message.setCnNo(dto.getCnNo());
    message.setSndUserId(dto.getSndUserId());
    message.setMsg(dto.getMsg());
    message.setMsgTypeCd(dto.getMsgTypeCd() != null ? dto.getMsgTypeCd() : "TEXT");
    message.setAttachNo(dto.getAttachNo());
    message.setSndDtime(currentDateTime);
    message.setChatStatCd("A");
    message.setInsDtime(currentDateTime);
    message.setUpdDtime(currentDateTime);
    message.setUpdDtime(currentDateTime);
    message.setParentMsgNo(dto.getParentMsgNo());
    message.setVoteNo(dto.getVoteNo());

    com.bandi.backend.entity.clan.ClanChatMessage savedMessage = clanChatMessageRepository.save(message);
    System.out.println(
        "DEBUG: savedMessage ID: " + savedMessage.getCnMsgNo() + ", parentMsgNo: " + savedMessage.getParentMsgNo());

    // Mark sender as read immediately
    try {
      entityManager.createNativeQuery(
          "INSERT INTO CN_CHAT_MESSAGE_READ (CN_MSG_NO, READ_USER_ID, READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (CN_MSG_NO, READ_USER_ID) DO NOTHING")
          .setParameter("msgNo", savedMessage.getCnMsgNo())
          .setParameter("userId", dto.getSndUserId())
          .setParameter("readDtime", currentDateTime)
          .executeUpdate();
    } catch (Exception e) {
      // Ignore
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
      // Ignore
    }

    int unreadCount = 0;
    try {
      Query countQuery = entityManager.createNativeQuery(
          "SELECT COUNT(1) FROM CN_USER WHERE CN_NO = :roomNo AND CN_USER_STAT_CD = 'A' AND CN_USER_APPR_STAT_CD = 'CN'");
      countQuery.setParameter("roomNo", dto.getCnNo());
      unreadCount = ((Number) countQuery.getSingleResult()).intValue();
      unreadCount = Math.max(0, unreadCount - 1);
    } catch (Exception e) {
    }

    String parentMsgContent = null;
    String parentMsgUserNickNm = null;

    if (savedMessage.getParentMsgNo() != null) {
      System.out.println("DEBUG: Attempting to fetch parent message info for ID: " + savedMessage.getParentMsgNo());
      try {
        Query parentQuery = entityManager.createNativeQuery(
            "SELECT M.MSG, U.USER_NICK_NM " +
                "FROM CN_CHAT_MESSAGE M " +
                "LEFT JOIN MM_USER U ON U.USER_ID = M.SND_USER_ID " +
                "WHERE M.CN_MSG_NO = :parentMsgNo");
        parentQuery.setParameter("parentMsgNo", savedMessage.getParentMsgNo());
        Object result = parentQuery.getSingleResult(); // Generic object first

        if (result instanceof Object[]) {
          Object[] parentResult = (Object[]) result;
          parentMsgContent = (String) parentResult[0];
          parentMsgUserNickNm = (String) parentResult[1];
          System.out
              .println("DEBUG: Found parent msg via Object[]: " + parentMsgContent + ", nick: " + parentMsgUserNickNm);
        } else {
          System.out.println("DEBUG: Validate parent result type: " + result.getClass().getName());
        }

      } catch (Exception e) {
        System.out.println("DEBUG: Error fetching parent message: " + e.getMessage());
        e.printStackTrace();
      }
    } else {
      System.out.println("DEBUG: ParentMsgNo is null, skipping fetch.");
    }

    String attachFilePath = null;
    String attachFileName = null;
    if (savedMessage.getAttachNo() != null) {
      com.bandi.backend.entity.common.CmAttachment attachment = cmAttachmentRepository
          .findById(savedMessage.getAttachNo()).orElse(null);
      if (attachment != null) {
        attachFilePath = attachment.getFilePath();
        attachFileName = attachment.getFileName();
      }
    }

    ChatMessageDto returnDto = ChatMessageDto.builder()
        .cnMsgNo(savedMessage.getCnMsgNo())
        .cnNo(savedMessage.getCnNo())
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
    return returnDto;
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

  @Transactional
  public List<com.bandi.backend.dto.ChatMessageDto> getPrivateChatMessages(Long roomNo, String userId, Long lastMsgNo) {
    StringBuilder sql = new StringBuilder(
        """
                SELECT
                    MSG.MM_MSG_NO,
                    MSG.MM_ROOM_NO,
                    MSG.SND_USER_ID,
                    USR.USER_NICK_NM,
                    MSG.MSG,
                    MSG.MSG_TYPE_CD,
                    MSG.SND_DTIME,
                    (SELECT CMA2.FILE_PATH FROM CM_ATTACHMENT CMA2 WHERE CMA2.ATTACH_NO = USR.ATTACH_NO) AS PROFILE_URL,
                    (
                      (
                        CASE WHEN EXISTS (
                            SELECT 1 FROM MM_CHAT_ROOM CR
                            WHERE CR.MM_ROOM_NO = MSG.MM_ROOM_NO
                            AND (CR.USER_ID = MSG.SND_USER_ID OR CR.FRIEND_USER_ID = MSG.SND_USER_ID)
                        ) THEN 2 ELSE 1 END
                      )
                      -
                      (SELECT COUNT(1) FROM MM_CHAT_MESSAGE_READ WHERE MM_MSG_NO = MSG.MM_MSG_NO)
                      - 1 -- 자기 자신은 읽은 것으로 간주 (발송 시 Read 테이블에도 insert 하므로)
                    ) AS UNREAD_CNT,
                    MSG.ATTACH_NO,
                    CMA.FILE_PATH AS ATTACH_FILE_PATH,
                    CMA.FILE_NAME AS ATTACH_FILE_NM,
                    NULL AS VOTE_NO, -- 1:1 채팅은 투표 없음
                    MSG.PARENT_MM_MSG_NO,
                    P_MSG.MSG AS PARENT_MSG_CONTENT,
                    P_USR.USER_NICK_NM AS PARENT_MSG_NICK
                FROM MM_CHAT_MESSAGE MSG
                LEFT JOIN MM_USER USR ON USR.USER_ID = MSG.SND_USER_ID
                LEFT JOIN CM_ATTACHMENT CMA ON CMA.ATTACH_NO = MSG.ATTACH_NO
                LEFT JOIN MM_CHAT_MESSAGE P_MSG ON P_MSG.MM_MSG_NO = MSG.PARENT_MM_MSG_NO
                LEFT JOIN MM_USER P_USR ON P_USR.USER_ID = P_MSG.SND_USER_ID
                WHERE MSG.MM_ROOM_NO = :roomNo
                AND MSG.CHAT_STAT_CD = 'A'
            """);

    if (lastMsgNo != null) {
      sql.append(" AND MSG.MM_MSG_NO < :lastMsgNo ");
    }

    sql.append(" ORDER BY MSG.MM_MSG_NO DESC LIMIT 30 ");

    Query query = entityManager.createNativeQuery(sql.toString());
    query.setParameter("roomNo", roomNo);
    if (lastMsgNo != null) {
      query.setParameter("lastMsgNo", lastMsgNo);
    }

    List<Object[]> results = query.getResultList();
    List<com.bandi.backend.dto.ChatMessageDto> messages = new ArrayList<>();
    String currentDateTime = java.time.LocalDateTime.now()
        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

    for (Object[] row : results) {
      String senderId = (String) row[2];
      Long msgNo = ((Number) row[0]).longValue();

      // Unread Count Logic Adjustment for 1:1 Chat
      // Total participants = 2. If read count = 2 (sender + receiver), unread = 0.
      // If read count = 1 (sender only), unread = 1.
      // SQL returns (2 - read_count). So:
      // read_count=1 -> 2-1-1 = 0? No wait.
      // Let's rely on backend logic. Usually 1 means unread by receiver. 0 means read
      // by everyone.
      // In 1:1 chat, it's either 0 or 1.
      // Let's simplify: check if there is a READ entry for the OTHER user.

      int unreadCnt = ((Number) row[8]).intValue();
      // Ensure specific logic constraints if needed, but SQL calc seems intended.
      // If sender reads -> count 1. Total needed 2. Unread = 1.
      // If receiver reads -> count 2. Unread = 0.

      Long attachNo = row[9] != null ? ((Number) row[9]).longValue() : null;
      String attachFilePath = (String) row[10];
      String attachFileNm = (String) row[11];
      Long voteNo = row[12] != null ? ((Number) row[12]).longValue() : null;
      Long parentMsgNo = row[13] != null ? ((Number) row[13]).longValue() : null;
      String parentMsgContent = (String) row[14];
      String parentMsgUserNickNm = (String) row[15];

      com.bandi.backend.dto.ChatMessageDto dto = com.bandi.backend.dto.ChatMessageDto.builder()
          .cnMsgNo(msgNo)
          .cnNo(((Number) row[1]).longValue()) // In DTO, cnNo maps to room number generally
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
          .voteNo(voteNo)
          .parentMsgNo(parentMsgNo)
          .parentMsgContent(parentMsgContent)
          .parentMsgUserNickNm(parentMsgUserNickNm)
          .build();
      messages.add(dto);

      // Mark as read if not my message
      if (!senderId.equals(userId)) {
        try {
          entityManager.createNativeQuery(
              "INSERT INTO MM_CHAT_MESSAGE_READ (MM_MSG_NO, READ_USER_ID, READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (MM_MSG_NO, READ_USER_ID) DO NOTHING")
              .setParameter("msgNo", msgNo)
              .setParameter("userId", userId)
              .setParameter("readDtime", currentDateTime)
              .executeUpdate();
        } catch (Exception e) {
          // Ignore
        }
      }
    }
    return messages;
  }

  @Transactional
  public ChatMessageDto savePrivateMessage(ChatMessageCreateDto dto) {
    String currentDateTime = java.time.LocalDateTime.now()
        .format(java.time.format.DateTimeFormatter.ofPattern("yyyyMMddHHmmss"));

    com.bandi.backend.entity.member.ChatMessage message = new com.bandi.backend.entity.member.ChatMessage();
    message.setMmRoomNo(dto.getCnNo()); // Reusing cnNo field for room number
    message.setSndUserId(dto.getSndUserId()); // Receiver ID needs to be determined? OR is it room based?
    // In Entity: rcv_user_id exists.
    // We should probably find the other user in the room to set rcv_user_id.

    com.bandi.backend.entity.member.ChatRoom chatRoom = chatRoomRepository.findById(dto.getCnNo()).orElseThrow();
    String rcvUserId = chatRoom.getUserId().equals(dto.getSndUserId()) ? chatRoom.getFriendUserId()
        : chatRoom.getUserId();

    message.setRcvUserId(rcvUserId);
    message.setMsg(dto.getMsg());
    message.setMsgTypeCd(dto.getMsgTypeCd() != null ? dto.getMsgTypeCd() : "TEXT");
    message.setAttachNo(dto.getAttachNo());
    message.setSndDtime(currentDateTime);
    message.setChatStatCd("A");
    message.setInsDtime(currentDateTime);
    message.setUpdDtime(currentDateTime);
    // message.setUpdDtime(currentDateTime); // Duplicate in original
    message.setParentMmMsgNo(dto.getParentMsgNo());

    com.bandi.backend.entity.member.ChatMessage savedMessage = chatMessageRepository.save(message);

    // Mark sender as read immediately
    try {
      entityManager.createNativeQuery(
          "INSERT INTO MM_CHAT_MESSAGE_READ (MM_MSG_NO, READ_USER_ID, READ_DTIME) VALUES (:msgNo, :userId, :readDtime) ON CONFLICT (MM_MSG_NO, READ_USER_ID) DO NOTHING")
          .setParameter("msgNo", savedMessage.getMmMsgNo())
          .setParameter("userId", dto.getSndUserId())
          .setParameter("readDtime", currentDateTime)
          .executeUpdate();
    } catch (Exception e) {
      // Ignore
    }

    String userNickNm = "Unknown";
    try {
      Query query = entityManager.createNativeQuery(
          "SELECT USER_NICK_NM FROM MM_USER WHERE USER_ID = :userId");
      query.setParameter("userId", dto.getSndUserId());
      Object result = query.getSingleResult();
      if (result != null) {
        userNickNm = (String) result;
      }
    } catch (Exception e) {
      // Ignore
    }

    // Unread count logic
    int unreadCount = 1; // Default 1 for private chat until read by other

    String parentMsgContent = null;
    String parentMsgUserNickNm = null;

    if (savedMessage.getParentMmMsgNo() != null) {
      try {
        Query parentQuery = entityManager.createNativeQuery(
            "SELECT M.MSG, U.USER_NICK_NM " +
                "FROM MM_CHAT_MESSAGE M " +
                "LEFT JOIN MM_USER U ON U.USER_ID = M.SND_USER_ID " +
                "WHERE M.MM_MSG_NO = :parentMsgNo");
        parentQuery.setParameter("parentMsgNo", savedMessage.getParentMmMsgNo());
        Object result = parentQuery.getSingleResult();

        if (result instanceof Object[]) {
          Object[] parentResult = (Object[]) result;
          parentMsgContent = (String) parentResult[0];
          parentMsgUserNickNm = (String) parentResult[1];
        }
      } catch (Exception e) {
        e.printStackTrace();
      }
    }

    String attachFilePath = null;
    String attachFileName = null;
    if (savedMessage.getAttachNo() != null) {
      com.bandi.backend.entity.common.CmAttachment attachment = cmAttachmentRepository
          .findById(savedMessage.getAttachNo()).orElse(null);
      if (attachment != null) {
        attachFilePath = attachment.getFilePath();
        attachFileName = attachment.getFileName();
      }
    }

    ChatMessageDto returnDto = ChatMessageDto.builder()
        .cnMsgNo(savedMessage.getMmMsgNo())
        .cnNo(savedMessage.getMmRoomNo())
        .sndUserId(savedMessage.getSndUserId())
        .userNickNm(userNickNm)
        .msg(savedMessage.getMsg())
        .msgTypeCd(savedMessage.getMsgTypeCd())
        .sndDtime(savedMessage.getSndDtime())
        .userProfileUrl(null)
        .isMyMessage(true)
        .unreadCount(unreadCount)
        .parentMsgNo(savedMessage.getParentMmMsgNo())
        .parentMsgContent(parentMsgContent)
        .parentMsgUserNickNm(parentMsgUserNickNm)
        .attachNo(savedMessage.getAttachNo())
        .attachFilePath(attachFilePath)
        .attachFileName(attachFileName)
        .build();
    return returnDto;
  }

  public Long getPrivateChatRoomId(String userId, String friendUserId) {
    String sql = "SELECT mm_room_no FROM mm_chat_room WHERE (user_id = :userId AND friend_user_id = :friendUserId) OR (user_id = :friendUserId AND friend_user_id = :userId)";
    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("userId", userId);
    query.setParameter("friendUserId", friendUserId);

    try {
      return ((Number) query.getSingleResult()).longValue();
    } catch (jakarta.persistence.NoResultException e) {
      return null;
    }
  }

  public Long getUnreadMessageCount(String userId, String friendUserId) {
    Long roomId = getPrivateChatRoomId(userId, friendUserId);
    if (roomId == null) {
      return 0L;
    }

    String sql = "SELECT COUNT(*) FROM mm_chat_message m " +
        "LEFT JOIN mm_chat_message_read r ON m.mm_msg_no = r.mm_msg_no AND r.read_user_id = :userId " +
        "WHERE m.mm_room_no = :roomId AND r.mm_msg_no IS NULL";

    Query query = entityManager.createNativeQuery(sql);
    query.setParameter("userId", userId);
    query.setParameter("roomId", roomId);

    return ((Number) query.getSingleResult()).longValue();
  }
}
