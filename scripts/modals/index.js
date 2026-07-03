(function (root) {
  function renderNoticeModal(ctx) {
    const { state, h } = ctx;
    if (!state.noticeModal) return "";
    const notices = {
      archive: {
        title: "关于开展学籍数据归档及离校过渡期账号权限调整的通知",
        dept: "教务处、信息化办公室",
        date: "2026-06-24",
        body: [
          "学校将于 2026 年 x 月 x 日 00:00 起集中归档近期学籍异动流程。",
          "处于离校、休学、退学、转专业等状态的学生，请及时登录综合教务服务平台核对待办事项。",
          "请各学院辅导员、教学秘书提醒相关学生及家长关注系统通知，避免影响后续材料核验。"
        ],
        attach: "附件：离校过渡期账号权限调整清单.pdf"
      },
      service: {
        title: "关于规范学生事务线上办理流程的提示",
        dept: "学生工作部、教务处",
        date: "2026-06-23",
        body: [
          "为提升办理效率，即日起涉及学籍异动、心理转介、住宿调整、奖助资格、图书清退、校园卡结算等事项，原则上通过学校网上办事大厅统一发起。",
          "补充说明或异议材料请在对应页面上传，请勿多系统重复提交。",
          "已进入终审或归档阶段的流程，部分原始材料可能暂不开放查看，如需核对请联系责任部门。"
        ],
        attach: "附件：学生事务线上办理常见问题说明.docx"
      }
    };
    const item = notices[state.noticeModal];
    return h`
      <div class="notice-modal-backdrop" data-action="close-notice-backdrop">
        <section class="notice-modal" role="dialog" aria-modal="true" aria-label="${item.title}" data-modal-panel="notice">
          <div class="notice-modal-head">
            <span>通知公告</span>
            <button data-action="close-notice" data-close-control="notice" aria-label="关闭公告">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>${item.title}</h2>
            <div class="notice-meta">发布单位：${item.dept}　发布时间：${item.date}　浏览次数：713</div>
            ${item.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            <div class="notice-attachment">${item.attach}</div>
            <div class="notice-sign">青川大学<br />${item.date}</div>
          </div>
        </section>
      </div>`;
  }

  function renderAffairsEvidenceModal(ctx) {
    const { state, h } = ctx;
    if (!state.affairsModal) return "";
    const items = {
      mengqing: {
        title: "材料归档优秀志愿者公示",
        tag: "学生事务 / 公示附件",
        evidence: "证据 15 · 孟清曾参与学生事务材料补录",
        body: [
          ["公示批次", "2026 春季学生志愿服务时长公示"],
          ["候选学生", `<span class="evidence-key">孟清</span>`],
          ["岗位内容", "处分、申诉、推免复核旧档扫描及编号补录"],
          ["交接记录", `<span class="evidence-key">GCZ-2024-discipline-withdraw</span> 由学院学生工作办公室接收，接收人：<span class="evidence-key">周启明</span>`],
          ["同批缓存", `<span class="evidence-key">recommend_rank_cache</span> 由学院学生工作办公室接收，接收人：<span class="evidence-key">周启明</span>`]
        ],
        note: `孟清参与旧档扫描和编号补录，和 <span class="evidence-key">顾天泽</span> 材料存在接触机会。`
      },
      xzy: {
        title: "谈话材料历史版本记录",
        tag: "材料归档 / 历史版本缓存",
        evidence: "证据 16 · 谈话草稿被撤回补录",
        body: [
          ["历史草稿", "事项范围为课程退选与休整说明"],
          ["撤回记录", "xzy_admin 撤回原草稿"],
          ["补录结果", "学院学生工作办公室补录为离校意愿"],
          ["系统备注", "历史版本由 xzy_admin 撤回，归档摘要由学院学生工作办公室补录"],
          ["残页状态", "仅保留摘要差异，原始谈话需回到材料归档页核验"]
        ],
        note: "这份残页的重点不是原话内容，而是更接近真实语境的草稿曾被撤回，随后由学院端补录。"
      }
    };
    const item = items[state.affairsModal];
    if (!item) return "";
    if (state.affairsModal === "xzy") {
      return h`
        <div class="notice-modal-backdrop" data-action="close-affairs-modal-backdrop">
          <section class="notice-modal" role="dialog" aria-modal="true" aria-label="${item.title}" data-modal-panel="affairs-evidence">
            <div class="notice-modal-head">
              <span>${item.tag}</span>
              <button data-action="close-affairs-modal" data-close-control="affairs" aria-label="关闭材料">×</button>
            </div>
            <div class="notice-modal-body">
              <h2>${item.title}</h2>
              <div class="notice-meta">来源：材料归档历史版本缓存　状态：仅保留差异残页</div>
              <div class="version-compare">
                <div>
                  <span>历史草稿 A</span>
                  <strong>课程退选 / 休整说明</strong>
                  <p>草稿保留事项范围，没有形成退学确认。</p>
                </div>
                <div>
                  <span>归档摘要</span>
                  <strong>终止当前学业安排意愿</strong>
                  <p>补录后进入离校材料链。</p>
                </div>
              </div>
              <div class="version-log">
                <div><span>撤回账号</span><strong>xzy_admin</strong></div>
                <div><span>补录单位</span><strong>学院学生工作办公室</strong></div>
                <div><span>残页状态</span><strong>只保留摘要差异，原始谈话需回到材料归档页核验</strong></div>
              </div>
              <div class="evidence-note">已写入本地取证夹：${item.evidence}</div>
              <div class="actions" style="justify-content:flex-end">
                <button class="primary" data-action="close-affairs-modal">我已查看</button>
              </div>
            </div>
          </section>
        </div>`;
    }
    return h`
      <div class="notice-modal-backdrop" data-action="close-affairs-modal-backdrop">
        <section class="notice-modal" role="dialog" aria-modal="true" aria-label="${item.title}" data-modal-panel="affairs-evidence">
          <div class="notice-modal-head">
            <span>${item.tag}</span>
            <button data-action="close-affairs-modal" data-close-control="affairs" aria-label="关闭材料">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>${item.title}</h2>
            <div class="notice-meta">来源：学生事务服务大厅　状态：已打开本地副本</div>
            <div class="archive-result affairs-record">
              ${item.body.map(([label, text]) => `<div><span>${label}</span><strong>${text}</strong></div>`).join("")}
            </div>
            <div class="affairs-note">${item.note}</div>
            <div class="notice-attachment">已写入本地取证夹：${item.evidence}</div>
            <div class="actions" style="justify-content:flex-end">
              <button class="primary" data-action="close-affairs-modal">我已查看</button>
            </div>
          </div>
        </section>
      </div>`;
  }

  function renderTalkSourceModal(ctx) {
    const { state, h } = ctx;
    if (!state.talkSourceModal) return "";
    return h`
      <div class="notice-modal-backdrop" data-action="close-talk-source-backdrop">
        <section class="notice-modal" role="dialog" aria-modal="true" aria-label="谈话原始记录" data-modal-panel="talk-source">
          <div class="notice-modal-head">
            <span>材料归档 / 原始谈话视图</span>
            <button data-action="close-talk-source" data-close-control="talk-source" aria-label="关闭原始记录">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>2026-06-12 13:40 谈话原始记录</h2>
            <div class="notice-meta">来源编号：chat_20260612_1340　当前视图：source/raw</div>
            <div class="talk-source-log">
              <div><strong>林华灿</strong><p>老师，我真的不想继续了……</p></div>
              <div><strong>林华灿</strong><p>我想退课。</p></div>
              <div><strong>林华灿</strong><p><strong>不然我真的要挂了！</strong></p></div>
              <div><strong>许知遥</strong><p>我理解，你先冷静一下。</p></div>
            </div>
            <div class="red-note">归档摘要把“挂科”的口语表达改写成生命威胁，并省略了“我想退课”的限定语境。</div>
            <div class="notice-attachment">已写入本地取证夹：证据 03 · 谈话摘要断章取义</div>
            <div class="actions" style="justify-content:flex-end">
              <button class="primary" data-action="close-talk-source">我已查看</button>
            </div>
          </div>
        </section>
      </div>`;
  }

  function renderWorkOrderFlowModal(ctx) {
    const { state, h } = ctx;
    if (!state.workOrderFlowModal) return "";
    const rows = [
      ["学院预审", "学院学生工作办公室", "PSY-20260619-021", "09:08", "10.18.4.27", "学院行政楼 413 室"],
      ["心理材料补充", "心理中心", "XG-20260619-021", "09:10", "10.18.4.27", "学院行政楼 413 室"],
      ["教务同步审核", "教务处", "XG-20260619-021", "09:11", "10.18.4.27", "学院行政楼 413 室"]
    ];
    return h`
      <div class="notice-modal-backdrop" data-action="close-flow-modal-backdrop">
        <section class="flow-modal" role="dialog" aria-modal="true" aria-label="申诉工单流转图" data-modal-panel="flow-modal">
          <div class="notice-modal-head">
            <span>学工系统 / 工单流转图</span>
            <button data-action="close-flow-modal" data-close-control="flow" aria-label="关闭流转图">×</button>
          </div>
          <div class="flow-modal-body">
            <h2>申诉工单流转图</h2>
            <p class="muted">该图显示学生提交异议后，材料如何在学院、教务处、心理中心和学工办公室之间互相引用。</p>
            <div class="flow-modal-diagram">
              ${rows.map(([title, unit, basis, time, ip, location]) => `
                <div class="flow-modal-node">
                  <span>${title}</span>
                  <strong>${unit}</strong>
                  <p>${basis}</p>
                  <b>${time}</b>
                  <em>${ip}</em>
                  <small>${location}</small>
                </div>
              `).join("")}
            </div>
            <table class="table flow-modal-table">
              <tr><th>流程节点</th><th>责任单位</th><th>处理依据</th><th>时间</th><th>IP 地址</th><th>所在位置</th></tr>
              ${rows.map(([title, unit, basis, time, ip, location]) => `<tr><td>${title}</td><td>${unit}</td><td>${basis}</td><td>${time}</td><td>${ip}</td><td>${location}</td></tr>`).join("")}
            </table>
            <div class="notice-attachment">要取得证据，请回到工单日志并点击任一重复出现的处理 IP。</div>
            <div class="actions" style="justify-content:flex-end">
              <button class="primary" data-action="close-flow-modal">返回工单</button>
            </div>
          </div>
        </section>
      </div>`;
  }

  function renderPublicChainModal(ctx) {
    const { state, h, has } = ctx;
    if (!state.publicChainModal) return "";
    const selected = (id) => state.publicChainFields.includes(id);
    const selectedCount = state.publicChainFields.length;
    return h`
      <div class="notice-modal-backdrop" data-action="close-public-chain-backdrop">
        <section class="notice-modal" role="dialog" aria-modal="true" aria-label="信息公开附件" data-modal-panel="public-chain">
          <div class="notice-modal-head">
            <span>信息公开 / 公开附件</span>
            <button data-action="close-public-chain" data-close-control="public-chain" aria-label="关闭公开附件">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>学生事务数字化治理试点二期采购公示</h2>
            <div class="notice-meta">公开批次：2026 年学生事务数字化治理试点二期　附件状态：公开摘要</div>
            <div class="public-doc-grid">
              <button class="archive-field ${selected("supplier") ? "selected" : ""}" data-action="public-chain-field-supplier">
                <span>中标供应商</span>
                <div class="archive-field-value">青川智教信息技术有限公司 / 联系人：<strong>顾明远</strong></div>
              </button>
              <button class="archive-field ${selected("partner") ? "selected" : ""}" data-action="public-chain-field-partner">
                <span>合作备案</span>
                <div class="archive-field-value">青川明远教育咨询有限公司 / 高校发展项目协作单位 / 联系人：<strong>顾明远</strong></div>
              </button>
              <button class="archive-field ${selected("minutes") ? "selected" : ""}" data-action="public-chain-field-minutes">
                <span>会议纪要节选</span>
                <strong>试点二期需接入教务、学工、心理与家长端状态字段；上线前保留来源端口与生成时间。</strong>
              </button>
            </div>
            <p class="muted" style="margin-top:10px">请依次标记这 3 个公开字段，让供应商、合作备案与会议纪要互相印证。</p>
            <div class="actions" style="justify-content:flex-end">
              <button data-action="public-chain-evidence" ${selectedCount >= 3 || has("e19") ? "" : "disabled"}>${has("e19") ? "重新查看核验记录" : `形成核验记录 ${selectedCount}/3`}</button>
            </div>
            ${has("e19") ? `<div class="evidence-note">已写入本地取证夹：证据 19 · 信息公开材料暴露制度利益链</div>` : ""}
          </div>
        </section>
      </div>`;
  }

  function renderGuTimelineModal(ctx) {
    const { state, h, has } = ctx;
    if (!state.guTimelineModal) return "";
    return h`
      <div class="notice-modal-backdrop" data-action="close-gu-timeline-backdrop">
        <section class="notice-modal" role="dialog" aria-modal="true" aria-label="新闻附件" data-modal-panel="gu-timeline">
          <div class="notice-modal-head">
            <span>校园生活 / 新闻附件</span>
            <button data-action="close-gu-timeline" data-close-control="gu-timeline" aria-label="关闭新闻附件">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>信息化实践贡献专项加分公示</h2>
            <div class="notice-meta">发布批次：2026 春季学院风采　附件：加分名单最终版</div>
            <div class="archive-result">
              <div>06-14：处分预警页面撤回，公开栏不再显示顾天泽姓名。</div>
              <div>06-18：成绩补录单进入复核，附件状态为待确认。</div>
              <div>06-19：推免候选资格复核完成，候选池刷新。</div>
              <div>06-20：信息化实践贡献专项加分公示发布，附件为加分名单最终版。</div>
            </div>
            <p class="muted" style="margin-top:10px">附件发布时间需与前序撤回、补录、复核记录一并留存。</p>
            <div class="actions" style="justify-content:flex-end">
              <button class="${has("e18") ? "" : "primary"}" data-action="gu-timeline-node">${has("e18") ? "重新查看发布节点" : "标记发布节点"}</button>
            </div>
            ${has("e18") ? `<div class="evidence-note">已写入本地取证夹：证据 18 · 顾天泽公开荣誉与异常节点重叠</div>` : ""}
          </div>
        </section>
      </div>`;
  }

  function renderIntroModal(ctx) {
    const { state, h } = ctx;
    if (state.introSeen) return "";
    const action = state.loggedIn ? "intro-seen" : "intro-seen-login";
    return h`
      <div class="intro-modal-backdrop">
        <section class="intro-modal" role="dialog" aria-modal="true" aria-label="背景信息">
          <figure class="intro-modal-figure">
            <img src="./assets/intro_screen_student_reaction.jpg" width="1200" height="675" decoding="async" fetchpriority="high" alt="林华灿从电脑屏幕前惊觉地看向系统页面" />
          </figure>
          <div class="intro-modal-body">
            <strong>昨晚 23:47，同学发来一句：“你真的退学了？”</strong>
            <p>你只是登录教务系统确认一下，却发现一份提交的<strong>《自愿退学申请》</strong>。</p>
            <p>查明这份申请是谁提交，怎么会在你的账号，否则似乎不只是退学这么简单……</p>
            <div class="actions">
              <button class="primary" data-action="${action}">确定</button>
            </div>
          </div>
        </section>
      </div>`;
  }

  function renderVoluntaryConfirmModal(ctx) {
    const { state, h } = ctx;
    if (!state.voluntaryConfirmOpen) return "";
    return h`
      <div class="notice-modal-backdrop" data-action="cancel-voluntary">
        <section class="notice-modal voluntary-confirm-modal" role="dialog" aria-modal="true" aria-label="确认自愿离校" data-modal-panel="voluntary-confirm">
          <div class="notice-modal-head">
            <span>本人最终确认</span>
            <button data-action="cancel-voluntary" data-close-control="voluntary" aria-label="取消自愿离校">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>你确认“自愿离校”吗？</h2>
            <p>点击确认，即可离开。</p>
            <p>点击确认，即可离开。</p>
            <p class="voluntary-confirm-command">点击确认。</p>
            <p class="voluntary-confirm-exit">离开。</p>
            <div class="actions" style="justify-content:flex-end">
              <button data-action="cancel-voluntary">返回</button>
              <button class="danger-btn" data-action="confirm-voluntary">确认</button>
            </div>
          </div>
        </section>
      </div>`;
  }

  function renderLibraryEggModal(ctx) {
    const { state, h, LIBRARY_EGGS } = ctx;
    if (!state.libraryEgg) return "";
    const item = LIBRARY_EGGS[state.libraryEgg];
    if (!item) return "";
    return h`
      <div class="notice-modal-backdrop">
        <section class="library-egg-modal" role="dialog" aria-modal="true" aria-label="${item.title}" data-modal-panel="library-egg">
          <div class="notice-modal-head">
            <span>${item.tag}</span>
            <button data-action="close-library-egg" data-close-control="library-egg" aria-label="关闭旧刊">×</button>
          </div>
          <div class="library-egg-body">
            <h2>${item.title}</h2>
            ${item.image ? `<img class="library-egg-image" src="${item.image}" width="1200" height="800" loading="lazy" decoding="async" alt="学生工作处周启明老师在 B4 号库前检查标识" />` : ""}
            ${item.body.map((paragraph) => `<p>${paragraph}</p>`).join("")}
            <div class="library-egg-footer">${item.footer}</div>
          </div>
        </section>
      </div>`;
  }

  function renderForumThreadModal(ctx) {
    const { state, h, FORUM_THREADS } = ctx;
    if (!state.forumThread) return "";
    const item = FORUM_THREADS[state.forumThread];
    if (!item) return "";
    return h`
      <div class="notice-modal-backdrop">
        <section class="forum-thread-modal" role="dialog" aria-modal="true" aria-label="${item.title}" data-modal-panel="forum-thread">
          <div class="notice-modal-head">
            <span>${item.tag}</span>
            <button data-action="close-forum-thread" data-close-control="forum-thread" aria-label="关闭帖子">×</button>
          </div>
          <div class="forum-thread-body">
            <h2>${item.title}</h2>
            <div class="forum-post-list">
              ${item.posts.map(([author, text]) => `
                <div class="forum-post ${author === "系统" ? "system" : ""}">
                  <strong>${author}</strong>
                  <p>${text}</p>
                </div>`).join("")}
            </div>
            <div class="library-egg-footer">${item.footer}</div>
          </div>
        </section>
      </div>`;
  }

  function renderForumPmPopup(ctx) {
    const { state, h } = ctx;
    if (!state.forumPmPopup) return "";
    return h`
      <div class="forum-pm-backdrop" data-action="close-forum-pm-backdrop">
        <section class="forum-pm-popup" role="dialog" aria-modal="true" aria-label="收到 guest_404 私信" data-modal-panel="forum-pm">
          <div class="forum-pm-terminal">PRIVATE MESSAGE / guest_404</div>
          <h2>收到一条离线私信</h2>
          <div class="forum-pm-preview forum-pm-message">
            <div class="forum-pm-meta">
              <strong>guest_404</strong>
              <span>缓存预览</span>
            </div>
            <ol class="forum-pm-lines compact">
              <li><span>孟清在查顾天泽撤回处分的事。</span></li>
              <li><span>尾号 713 的东西会被锁，尤其是推免候选排名缓存。</span></li>
            </ol>
            <div class="forum-pm-sign">匿名</div>
          </div>
          <button class="primary" data-action="close-forum-pm">查看</button>
        </section>
      </div>`;
  }

  function renderAppealHorrorPopup(ctx) {
    const { state, h } = ctx;
    if (!state.appealHorrorPopup) return "";
    return h`
      <div class="appeal-horror" aria-live="assertive">
        <section class="appeal-horror-panel" role="dialog" aria-modal="true" aria-label="关怀处置依据已生成" data-modal-panel="appeal-horror">
          <div class="appeal-horror-code">CARE-AUTO / LOOP-${String(state.appealCount).padStart(2, "0")} / SYNC-GUARDIAN</div>
          <h2>请不要重复提交！！</h2>
          <div class="appeal-horror-message">
            <p><strong>同学，你需要关怀吗？</strong></p>
            <p>当你有困难时，可以告诉老师，老师会很高兴地帮你。</p>
            <p>离开学校后，请马上回家，不按时回家，家长会很担心。</p>
          </div>
          <div class="appeal-horror-sync">已经写入自动关怀记录，并同步到家长端风险提示。</div>
          <button class="primary" data-action="close-appeal-horror">查看处置依据</button>
        </section>
      </div>`;
  }

  function renderRestoreNoticeModal(ctx) {
    const { state, h } = ctx;
    if (!state.restoreNoticePopup) return "";
    return h`
      <div class="notice-modal-backdrop" data-action="close-restore-notice-backdrop">
        <section class="notice-modal" role="dialog" aria-modal="true" aria-label="撤销申请已接收" data-modal-panel="restore-notice">
          <div class="notice-modal-head">
            <span>学籍异动撤销回执</span>
            <button data-action="close-restore-notice" data-close-control="restore" aria-label="关闭回执">×</button>
          </div>
          <div class="notice-modal-body">
            <h2>撤销申请已接收</h2>
            <div class="notice-meta">回执编号：XJYD-0713-ROLLBACK　状态：在籍学生</div>
            <p>学籍状态已恢复为在籍，离校过渡期权限调整已撤回。</p>
            <p>部分此前显示“无权限查看”的材料，已允许以学生身份重新核验。</p>
            <div class="notice-attachment">新增可核验范围：图书馆封闭馆藏附件、学工完整流转记录、信息公开会议纪要 OCR。</div>
            <div class="archive-result" style="margin-top:10px">
              <div>下一步 1：回到材料归档，重新核验心理转介单的课程反馈来源，以解锁心理中心。</div>
              <div>下一步 2：回到图书馆，记录 B4 附件目录。</div>
              <div>下一步 3：进入信息公开，查看完整 OCR 与推免候选缓存。</div>
            </div>
            <div class="actions" style="justify-content:flex-end">
              <button class="primary" data-action="close-restore-notice">继续调查</button>
            </div>
          </div>
        </section>
      </div>`;
  }

  root.VoluntaryLeaveModals = {
    renderNoticeModal,
    renderAffairsEvidenceModal,
    renderTalkSourceModal,
    renderWorkOrderFlowModal,
    renderPublicChainModal,
    renderGuTimelineModal,
    renderIntroModal,
    renderVoluntaryConfirmModal,
    renderLibraryEggModal,
    renderForumThreadModal,
    renderForumPmPopup,
    renderAppealHorrorPopup,
    renderRestoreNoticeModal
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.VoluntaryLeaveModals;
  }
})(typeof window !== "undefined" ? window : globalThis);
