package com.bandi.backend.service;

import java.util.*;
import java.util.stream.Collectors;

public class MatchTest {
    static class ClanGatherApply {
        String userId;
        String sessionTypeCd1st;
        int session1stScore;
        String userGenderCd;
        String userMbti;

        public ClanGatherApply(String u, String s, int sc, String g, String m) {
            userId = u;
            sessionTypeCd1st = s;
            session1stScore = sc;
            userGenderCd = g;
            userMbti = m;
        }

        public String getUserId() {
            return userId;
        }

        public String getSessionTypeCd1st() {
            return sessionTypeCd1st;
        }

        public int getSession1stScore() {
            return session1stScore;
        }

        public String getUserGenderCd() {
            return userGenderCd;
        }

        public String getUserMbti() {
            return userMbti;
        }
    }

    static class RoomState {
        int totalSkill = 0;
        Map<String, Integer> currentSessionCnt = new HashMap<>();
        Map<String, Integer> currentGenderCnt = new HashMap<>();
        Map<String, Integer> currentMbtiTypeCnt = new HashMap<>();
        List<ClanGatherApply> members = new ArrayList<>();

        double getAvgSkill() {
            return members.isEmpty() ? 0 : (double) totalSkill / members.size();
        }

        void add(ClanGatherApply a) {
            members.add(a);
            totalSkill += a.getSession1stScore();
            currentSessionCnt.put(a.getSessionTypeCd1st(),
                    currentSessionCnt.getOrDefault(a.getSessionTypeCd1st(), 0) + 1);
            if (a.getUserGenderCd() != null)
                currentGenderCnt.put(a.getUserGenderCd(), currentGenderCnt.getOrDefault(a.getUserGenderCd(), 0) + 1);
            if (a.getUserMbti() != null && a.getUserMbti().length() > 0) {
                String m = a.getUserMbti().substring(0, 1).toUpperCase();
                currentMbtiTypeCnt.put(m, currentMbtiTypeCnt.getOrDefault(m, 0) + 1);
            }
        }

        void remove(ClanGatherApply a) {
            if (members.remove(a)) {
                totalSkill -= a.getSession1stScore();
                currentSessionCnt.put(a.getSessionTypeCd1st(),
                        currentSessionCnt.getOrDefault(a.getSessionTypeCd1st(), 0) - 1);
                if (a.getUserGenderCd() != null)
                    currentGenderCnt.put(a.getUserGenderCd(),
                            currentGenderCnt.getOrDefault(a.getUserGenderCd(), 0) - 1);
                if (a.getUserMbti() != null && a.getUserMbti().length() > 0) {
                    String m = a.getUserMbti().substring(0, 1).toUpperCase();
                    currentMbtiTypeCnt.put(m, currentMbtiTypeCnt.getOrDefault(m, 0) - 1);
                }
            }
        }
    }

    public static void main(String[] args) {
        int targetRoomCnt = 2;
        Map<String, Long> targetSessionCnts = new HashMap<>();
        targetSessionCnts.put("04", 4L); // 4 participants for session 04

        List<ClanGatherApply> validApplicants = new ArrayList<>();
        validApplicants.add(new ClanGatherApply("user1", "04", 5, "M", "E"));
        validApplicants.add(new ClanGatherApply("user2", "04", 4, "F", "I"));
        validApplicants.add(new ClanGatherApply("user3", "04", 4, "M", "I"));
        validApplicants.add(new ClanGatherApply("user4", "04", 2, "F", "E"));

        boolean isSkillBalanceOn = false;
        boolean isGenderBalanceOn = true;
        boolean isMbtiBalanceOn = true;

        List<RoomState> rooms = new ArrayList<>();
        for (int i = 0; i < targetRoomCnt; i++)
            rooms.add(new RoomState());

        List<ClanGatherApply> pool = new ArrayList<>(validApplicants);
        for (ClanGatherApply app : pool) {
            String sessionCd = app.getSessionTypeCd1st();
            long totalRequiredSessionCnt = targetSessionCnts.getOrDefault(sessionCd, 0L);
            long targetCntPerRoom = (long) Math.ceil((double) totalRequiredSessionCnt / (double) targetRoomCnt);

            RoomState bestRoom = null;
            double maxScore = -Double.MAX_VALUE;

            System.out.println("Assigning " + app.getUserId() + " skill=" + app.getSession1stScore());

            for (RoomState r : rooms) {
                if (r.currentSessionCnt.getOrDefault(sessionCd, 0) >= targetCntPerRoom) {
                    System.out.println("  Room skips (cap reached): " + r.members.size());
                    continue;
                }

                double score = 0;
                if (!isSkillBalanceOn) {
                    double avg = r.getAvgSkill();
                    if (r.members.isEmpty()) {
                        score += 50.0;
                    } else {
                        score += (5.0 - Math.abs(app.getSession1stScore() - avg)) * 10.0;
                        for (ClanGatherApply m : r.members) {
                            if (Math.abs(app.getSession1stScore() - m.getSession1stScore()) >= 2) {
                                score -= 200.0;
                                break;
                            }
                        }
                    }
                }

                if (isGenderBalanceOn && app.getUserGenderCd() != null) {
                    int maxGender = rooms.stream()
                            .mapToInt(rm -> rm.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0)).max().orElse(0);
                    score += (maxGender - r.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0)) * 25.0;
                }
                if (isMbtiBalanceOn && app.getUserMbti() != null && app.getUserMbti().length() > 0) {
                    String m = app.getUserMbti().substring(0, 1).toUpperCase();
                    int maxMbti = rooms.stream().mapToInt(rm -> rm.currentMbtiTypeCnt.getOrDefault(m, 0)).max()
                            .orElse(0);
                    score += (maxMbti - r.currentMbtiTypeCnt.getOrDefault(m, 0)) * 20.0;
                }

                System.out.println("  Room evaluation score: " + score);
                if (score > maxScore || bestRoom == null) {
                    maxScore = score;
                    bestRoom = r;
                }
            }

            if (bestRoom == null) {
                System.out.println("  Fallback pass triggered");
                maxScore = -Double.MAX_VALUE;
                for (RoomState r : rooms) {
                    double score = 0;
                    if (!isSkillBalanceOn) {
                        double avg = r.getAvgSkill();
                        if (r.members.isEmpty()) {
                            score += 50.0;
                        } else {
                            score += (5.0 - Math.abs(app.getSession1stScore() - avg)) * 10.0;
                            for (ClanGatherApply m : r.members) {
                                if (Math.abs(app.getSession1stScore() - m.getSession1stScore()) >= 2) {
                                    score -= 200.0;
                                    break;
                                }
                            }
                        }
                    }
                    if (isGenderBalanceOn && app.getUserGenderCd() != null) {
                        int maxGender = rooms.stream()
                                .mapToInt(rm -> rm.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0)).max()
                                .orElse(0);
                        score += (maxGender - r.currentGenderCnt.getOrDefault(app.getUserGenderCd(), 0)) * 25.0;
                    }
                    if (isMbtiBalanceOn && app.getUserMbti() != null && app.getUserMbti().length() > 0) {
                        String m = app.getUserMbti().substring(0, 1).toUpperCase();
                        int maxMbti = rooms.stream().mapToInt(rm -> rm.currentMbtiTypeCnt.getOrDefault(m, 0)).max()
                                .orElse(0);
                        score += (maxMbti - r.currentMbtiTypeCnt.getOrDefault(m, 0)) * 20.0;
                    }

                    System.out.println("  Fallback room evaluation score: " + score);
                    if (score > maxScore || bestRoom == null) {
                        maxScore = score;
                        bestRoom = r;
                    }
                }
            }
            if (bestRoom != null) {
                bestRoom.add(app);
                System.out.println("  Assigned to a room. Size = " + bestRoom.members.size());
            } else {
                System.out.println("  Could not find a room!");
            }
        }

        for (int i = 0; i < rooms.size(); i++) {
            System.out.println("Room " + i + " size: " + rooms.get(i).members.size() + ", members: " +
                    rooms.get(i).members.stream().map(m -> m.getUserId()).collect(Collectors.toList()));
        }
    }
}
