package com.bandi.backend.repository;

import com.bandi.backend.entity.member.GroupFriend;
import com.bandi.backend.entity.member.GroupFriendId;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GroupFriendRepository extends JpaRepository<GroupFriend, GroupFriendId> {
    java.util.List<GroupFriend> findByUserIdAndFriendStatCd(String userId, String friendStatCd);

    @org.springframework.data.jpa.repository.Query("SELECT g FROM GroupFriend g WHERE (g.userId = :userId OR g.friendUserId = :userId) AND g.friendStatCd = :friendStatCd")
    java.util.List<GroupFriend> findFriends(@org.springframework.data.repository.query.Param("userId") String userId,
            @org.springframework.data.repository.query.Param("friendStatCd") String friendStatCd);
}
