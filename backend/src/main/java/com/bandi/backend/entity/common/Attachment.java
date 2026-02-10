package com.bandi.backend.entity.common;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Entity
@Table(name = "CM_ATTACHMENT")
@Getter
@Setter
public class Attachment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "attach_no")
    private Long attachNo;

    @Column(name = "org_file_nm", length = 200)
    private String orgFileNm;

    @Column(name = "save_file_nm", length = 200)
    private String saveFileNm;

    @Column(name = "file_path", length = 400)
    private String filePath;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(name = "file_ext", length = 10)
    private String fileExt;

    @Column(name = "ins_dtime", length = 14)
    private String insDtime;

    @Column(name = "ins_id", length = 20)
    private String insId;

    @Column(name = "upd_dtime", length = 14)
    private String updDtime;

    @Column(name = "upd_id", length = 20)
    private String updId;
}
