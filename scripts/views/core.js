(function (root) {
  function renderAcademic(ctx) {
    const { state, inspected, has, h, header } = ctx;
    const voluntaryPressure = Math.max(0, Math.min(4, (state.withdrawAttempts || 0) - 1));
    return h`
      ${header(state.studentStatusRestored ? "学籍异动撤销回执" : "学籍异动终审提醒", state.studentStatusRestored ? "退学流程已回转至 0%。当前学籍状态：在籍。" : "离校手续完成度 87%。当前节点：本人最终确认。")}
      <div class="panel-body">
        <div class="grid">
          <div class="card">
            <div class="card-head">自愿退学申请 <span class="tag ${state.studentStatusRestored ? "ok" : "danger"}">${state.studentStatusRestored ? "已撤销" : "终审中"}</span></div>
            <div class="card-body">
              <div class="kv">
                <div><span>申请人</span><span>林华灿</span></div>
                <div><span>申请来源</span><span>学生端在线提交</span></div>
                <div><span>提交时间</span><span>2026-06-24 02:13:47</span></div>
                <div><span>流程编号</span><span>QCU-XJYD-20260619-0713</span></div>
                <div><span>当前状态</span><span>${state.studentStatusRestored ? "流程已退回并允许学生端撤销" : "本人最终确认"}</span></div>
              </div>
              <div class="actions">
                <button class="primary" data-action="open-materials">查看材料</button>
                <button class="${state.studentStatusRestored ? "primary" : "danger-btn"}" data-action="withdraw">${state.studentStatusRestored ? "查看撤销回执" : "撤销申请"}</button>
                ${state.studentStatusRestored ? `<button data-screen="review">提交复学后补充材料</button>` : `<button class="voluntary-confirm pressure-${voluntaryPressure}" data-action="voluntary">我已知悉，并自愿离校</button>`}
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-head">流程完成度</div>
            <div class="card-body">
              <div class="progress"><span style="width:${state.progress}%"></span></div>
              <p class="muted">${state.studentStatusRestored ? "学院、教务、心理中心、家长端和学工部已完成回转确认，离校流程不再作为本人确认记录。" : `辅导员谈话、学院审核、家长知情及心理风险评估均显示<span class="danger-emphasis">已完成</span>。`}</p>
              <div class="chat">
                <div class="bubble">许知遥：我知道你现在可能很激动。我们已经沟通过很多次了。</div>
                <div class="bubble">许知遥：先不要再重复提交了，好好休息。</div>
              </div>
            </div>
          </div>
        </div>
        <div class="ambient-grid">
          <div class="card">
            <div class="card-head">本周课表</div>
            <div class="card-body">
              <table class="table ambient-table">
                <tr><th>周次</th><th>课程</th><th>地点</th><th>状态</th></tr>
                <tr><td>周一 3-4</td><td>数据仓库与数据挖掘</td><td>尚德楼 A203</td><td>已结束</td></tr>
                <tr><td>周三 7-8</td><td>信息系统项目管理</td><td>明理楼 406</td><td>待上课</td></tr>
                <tr><td>周五 1-2</td><td>专业实习说明会</td><td>线上会议</td><td>未签到</td></tr>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-head">校内通知</div>
            <div class="card-body">
              <ul class="ambient-list">
                <li>关于期末周开放通宵自习室的通知</li>
                <li>信息管理学院 2026 届实习单位双选会安排</li>
                <li>尚德楼局部区域设备检修期间绕行提示</li>
                <li>校园卡补贴到账提醒：毕业季餐饮优惠券</li>
              </ul>
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:12px"><div class="card-head">流程办理时间</div><div class="card-body"><div class="timeline-log">
          <button class="timeline-row ${has("e01") ? "marked" : ""}" data-action="flow-early-node"><span>2026-06-19 09:08</span><strong>学院预审通过</strong></button>
          <button class="timeline-row ${has("e01") ? "marked" : ""}" data-action="flow-early-node"><span>2026-06-19 09:10</span><strong>心理风险材料已补充</strong></button>
          <button class="timeline-row ${has("e01") ? "marked" : ""}" data-action="flow-early-node"><span>2026-06-19 09:11</span><strong>家长知情确认已上传</strong></button>
          <button class="timeline-row ${has("e01") ? "marked" : ""}" data-action="flow-early-node"><span>2026-06-24 02:13</span><strong>学生本人提交申请</strong></button>
        </div>${has("e01") ? `<div class="red-note">审核节点早于学生本人提交申请，流程时间线不成立。</div>` : `<p class="muted" style="margin-top:8px">点击任一办理时间或节点名称，核对流程顺序。</p>`}</div></div>
      </div>`;
  }

  function renderMaterials(ctx) {
    const { state, h, header } = ctx;
    const tabs = [
      ["application", "退学申请书"],
      ["talk", "谈话记录"],
      ["psychDoc", "心理转介单"],
      ["dormDoc", "宿舍退宿"],
      ["libraryDoc", "图书馆清退"]
    ];
    return h`
      ${header("离校材料归档清单", "部分原始材料暂不开放查看。如需核对，请联系对应责任部门。")}
      <div class="panel-body">
        <div class="chips">${tabs.map(([id, label]) => `<button class="chip ${state.materialTab === id ? "selected" : ""}" data-tab="${id}">${label}</button>`).join("")}</div>
        <div style="margin-top:12px">${renderMaterialTab(ctx)}</div>
      </div>`;
  }

  function renderMaterialTab(ctx) {
    const { state, inspected, has, h } = ctx;
    if (state.materialTab === "application") {
      return h`
        <div class="${state.pdfMetaVisible ? "doc-view" : ""}">
          <div class="card">
            <div class="card-head">自愿退学申请书 <span class="tag">PDF 预览</span></div>
            <div class="card-body">
              <p>本人林华灿，因无法适应当前学习生活，经与家长、辅导员、学院充分沟通后，自愿申请退学，并理解离校后果。</p>
              <div class="actions">
                <button data-action="pdf-meta">查看 PDF 信息</button>
              </div>
              ${state.pdfMetaVisible ? `<div class="pdf-meta-table">
                <div><span>Creator</span><button data-action="pdf-creator">QCU-Office-Template</button></div>
                <div><span>Author</span><button class="inspect-field ${state.pdfAuthorMarked ? "marked" : ""}" data-action="pdf-author">xzy_admin</button></div>
                <div><span>Created</span><button data-action="pdf-created">2026-06-19 09:02:11</button></div>
              </div>
              ${state.pdfAuthorMarked ? `<div class="red-note">作者字段并非学生账号，且创建时间早于学生端提交时间。</div>` : ""}` : ""}
            </div>
          </div>
          ${state.pdfMetaVisible ? `<img class="asset" src="./assets/doc_withdrawal_application_scan_v3.jpg" alt="自愿退学申请书扫描件" />` : ""}
        </div>`;
    }
    if (state.materialTab === "talk") {
      return h`
        <div class="card">
          <div class="card-head">辅导员谈话记录 <span class="tag warn">仅摘要</span></div>
          <div class="card-body">
            <p>学生表示<button class="inspect-token ${inspected("talk-quote") ? "marked" : ""}" data-action="talk-quote">“真的不想继续了”</button>，否则可能进行<strong>生命威胁</strong>，对后续学业安排抵触明显。同意其暂时离开学校环境。</p>
            ${inspected("talk-quote") ? `<div class="kv compact-kv" style="margin-top:10px">
              <div><span>当前显示</span><span>摘要版</span></div>
              <div><span>来源记录</span><span>2026-06-12 13:40 谈话原始记录</span></div>
              <div><span>原文状态</span><span>未展开</span></div>
            </div>
            <div class="input-row">
              <input id="url-param" placeholder="输入“原始记录”或来源编号" />
              <button data-action="source-param">查看原始记录</button>
            </div>
            <p class="muted">归档页只展示摘要，来源记录不在页面菜单中。来源编号：chat_20260612_1340。</p>` : `<p class="muted">记录类型：谈话摘要。引用来源：未展开。</p>`}
            ${has("e03") ? `<div class="red-note">原始记录显示，这句话指向退课而不是退学。<button class="text-link" data-action="open-talk-source">重新查看原始记录</button></div>` : ""}
          </div>
        </div>`;
    }
    if (state.materialTab === "psychDoc") {
      return h`
        <div class="card">
          <div class="card-head">心理咨询转介单 <span class="tag danger">橙色风险</span></div>
          <div class="card-body">
            <div class="kv">
              <div><span>触发项</span><span>睡眠异常、缺勤、对学校处理结果表示强烈不满、拒绝签署知情同意</span></div>
              <div><span>量表来源</span><span>SCL-90 校园适应性简版</span></div>
              <div><span>请求记录</span><span><button class="inspect-token ${inspected("survey-source") ? "marked" : ""}" data-action="survey-source">2026-06-10 转介材料来源</button></span></div>
            </div>
            ${inspected("survey-source") || has("e04") ? `<div class="card embedded-card">
              <div class="card-head">请求详情</div>
              <div class="card-body">
                <div class="kv compact-kv">
                  <div><span>页面标题</span><span>${state.studentStatusRestored ? "2026 春季学期课程学习体验反馈" : "2026 春季学期****"}</span></div>
                  <div><span>发起单位</span><span>${state.studentStatusRestored ? "本科教学质量办公室" : "****"}</span></div>
                  <div><span>用途</span><span>${state.studentStatusRestored ? "课程改进与教学评价，不作为心理评估材料" : "****"}</span></div>
                  ${state.studentStatusRestored ? `<div><span>反馈结果</span><span><button class="inspect-token ${has("e04") ? "marked" : ""}" data-action="survey-map">“对课程安排非常不满” → “对学校处理结果表示强烈不满”</button></span></div>
                  <div><span>反馈结果</span><span><button class="inspect-token ${has("e04") ? "marked" : ""}" data-action="survey-map">“不愿继续本课程学习” → “终止学业意愿”</button></span></div>` : `<div><span>内容项</span><span><button class="inspect-token" data-action="survey-map">“对****非常不满” …… “不愿继续****学习”</button></span></div>`}
                </div>
                ${!state.studentStatusRestored ? `<div class="unlock-box">
                  <p>当前账号处于离校过渡期，仅能查看脱敏请求详情。完整原表需要在籍学生的课程平台权限。</p>
                  <p>若退学流程回转并恢复学生身份，可重新核验此页面。</p>
                  <p>权限恢复后，可重新核验原始反馈来源并进入心理中心复核。</p>
                </div>` : ""}
                ${state.studentStatusRestored && !has("e04") ? `<div class="notice" style="margin-top:10px">权限恢复后，完整页面显示它来自课程学习体验反馈，不是独立心理评估。继续点击任一“反馈结果”转换字段，即可写入证据并解锁心理中心。</div>` : ""}
                ${has("e04") ? `<div class="red-note">这份风险材料的原始页面、发起单位和反馈结果都指向课程反馈问卷，不能证明独立心理评估。</div>` : ""}
              </div>
            </div>` : `<p class="muted">风险摘要未显示原始页面用途。</p>`}
          </div>
        </div>`;
    }
    if (state.materialTab === "dormDoc") {
      return h`
        <div class="${has("e05") ? "doc-view" : ""}">
          <div class="card">
            <div class="card-head">宿舍退宿申请 <span class="tag warn">已通过</span></div>
            <div class="card-body">
              <div class="kv">
                <div><span>退宿申请</span><span><button class="inspect-token ${inspected("dorm-apply") ? "marked" : ""}" data-action="dorm-apply">2026-06-18 22:41</button></span></div>
                <div><span>柜锁维修</span><span><button class="inspect-token ${inspected("dorm-repair") ? "marked" : ""}" data-action="dorm-repair">2026-06-18 22:36 · 已打开</button></span></div>
                <div><span>床位状态</span><span>待新生调配</span></div>
              </div>
              ${has("e05") ? `<div class="red-note">柜锁维修早于退宿申请，宿舍物品清退并非学生主动发起。</div>` : ""}
            </div>
          </div>
          ${has("e05") ? `<img class="asset" src="./assets/evidence_dorm_cabinet_maintenance_v3.jpg" alt="宿舍柜门维修照片" />` : ""}
        </div>`;
    }
    return h`
      <div class="card">
        <div class="card-head">图书馆清退通知 <span class="tag">欠书清单</span></div>
        <div class="card-body">
          <p>《青川大学安全管理年鉴 2019-2022》 · 索书号：<button class="inspect-token ${inspected("library-callno") ? "marked" : ""}" data-action="library-callno">QCU-SEC-B4-0713</button> · 状态：未归还</p>
          <p class="muted">公开馆藏无法直接打开该编号。可在统一检索中尝试组合地点、尾号和来源词。</p>
          <div class="actions"><button data-action="open-library">进入馆藏搜索</button></div>
        </div>
      </div>`;
  }

  function renderStudent(ctx) {
    const { state, inspected, has, h, header, renderRiskLogs, getAppealProfile, REVIEW_ROUTE } = ctx;
    const appealProfile = getAppealProfile();
    return h`
      ${header("学生事务申诉工单", "工单流转期间，原学籍异动流程照常推进。")}
      <div class="panel-body">
        <div class="grid">
          <div class="card">
            <div class="card-head">SS-20260624-0427 <span class="tag warn">流转中</span></div>
            <div class="card-body">
              <p>您的诉求涉及多个责任单位，已转交学院学生工作办公室核实。</p>
              <div class="actions">
                <button data-action="appeal">再次提交异议</button>
                <button data-action="flow-loop">${state.flowPreviewVisible || has("e07") ? "重新查看流转图" : "查看流转图"}</button>
              </div>
            </div>
          </div>
          <div class="card">
            <div class="card-head">学生画像摘要</div>
            <div class="card-body">
              ${appealProfile ? `<p class="muted">${appealProfile}</p>` : ""}
              ${state.appealHorrorSeen ? `<div class="care-escalation compact-care">
                <strong>关怀处置依据已生成</strong>
                <table class="table ambient-table">
                  <tr><th>触发项</th><td>重复提交异议 / 要求核对原始材料</td></tr>
                  <tr><th>平台口径</th><td>对既有沟通结果不认可，存在持续对抗倾向</td></tr>
                  <tr><th>处置建议</th><td>减少学生端反复确认，优先同步家长端风险提示</td></tr>
                </table>
                <div class="actions"><button data-action="parent-cache">查看家长端知情状态</button></div>
              </div>` : ""}
              ${state.flowPreviewVisible || has("e07") ? `<div class="flow-preview">
                <div class="flow-preview-grid" aria-label="申诉工单流转摘要">
                  <span>学院</span><strong>09:08</strong><em>10.18.4.27</em>
                  <span>心理中心</span><strong>09:10</strong><em>10.18.4.27</em>
                  <span>教务处</span><strong>09:11</strong><em>10.18.4.27</em>
                </div>
                <div class="flow-preview-footer">
                  <span>流转图预览</span>
                  <button data-action="open-flow-modal">查看完整图</button>
                </div>
              </div>` : ""}
            </div>
          </div>
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-head">关怀记录 <span class="tag warn">平台生成</span></div>
          <div class="card-body">
            ${renderRiskLogs()}
          </div>
        </div>
        <div class="ambient-grid">
          <div class="card">
            <div class="card-head">辅导员近期通知</div>
            <div class="card-body">
              <ul class="ambient-list">
                <li>期末周请同学们按时作息，遇到困难及时联系老师。</li>
                <li>近期学院将集中核对实习去向、住宿状态和奖助材料。</li>
                <li>请不要在未核实情况下转发校内突发事件相关图片。</li>
              </ul>
            </div>
          </div>
          <div class="card">
            <div class="card-head">学生事务待办</div>
            <div class="card-body">
              <table class="table ambient-table">
                <tr><th>事项</th><th>状态</th></tr>
                <tr><td>暑期留校申请</td><td>未提交</td></tr>
                <tr><td>实习安全承诺书</td><td>待确认</td></tr>
                <tr><td>心理健康月讲座签到</td><td>缺席</td></tr>
              </table>
            </div>
          </div>
        </div>
        ${inspected("flow-loop") || has("e07") ? `<div class="card" style="margin-top:12px"><div class="card-head">责任闭环对比</div><div class="card-body"><table class="table"><tr><th>单位</th><th>处理依据</th><th>创建时间</th><th>IP 地址</th><th>所在位置</th></tr><tr><td>学院</td><td>PSY-20260619-021</td><td>09:08</td><td><button class="inspect-token ${has("e07") ? "marked" : ""}" data-action="flow-ip">10.18.4.27</button></td><td>学院行政楼 413 室</td></tr><tr><td>心理中心</td><td>XG-20260619-021</td><td>09:10</td><td><button class="inspect-token ${has("e07") ? "marked" : ""}" data-action="flow-ip">10.18.4.27</button></td><td>学院行政楼 413 室</td></tr><tr><td>教务处</td><td>XG-20260619-021</td><td>09:11</td><td><button class="inspect-token ${has("e07") ? "marked" : ""}" data-action="flow-ip">10.18.4.27</button></td><td>学院行政楼 413 室</td></tr></table>${has("e07") ? `<div class="red-note">三个责任单位来自同一内网地点，所谓“多部门独立审核”不成立。</div>` : `<p class="muted" style="margin-top:8px">点击任一重复 IP，标记多部门审核来自同一地点。</p>`}</div></div>` : ""}
        ${state.studentStatusRestored ? `<div class="card" style="margin-top:12px">
          <div class="card-head">完整回转记录 <span class="tag ok">复核完成</span></div>
          <div class="card-body">
            <table class="table">
              <tr><th>节点</th><th>确认事项</th><th>完成度</th></tr>
              ${REVIEW_ROUTE.map(([unit, desc, progress], index) => `<tr><td>${index + 1}. ${unit}</td><td>${desc}</td><td>${progress}%</td></tr>`).join("")}
            </table>
          </div>
        </div>` : ""}
      </div>`;
  }

  function renderArchive(ctx) {
    const { state, has, h, header } = ctx;
    const fields = [
      ["archive-source", "原始谈话", "老师，我真的不想继续了……我想退课。不然我真的要挂了！"],
      ["archive-summary", "模板摘要", "学生多次表达终止学业意愿，对后续安排抵触明显。"],
      ["archive-parent", "家长端摘要", "同意学校建议学生暂时离校休整。"],
      ["archive-final", "教务归档", "家长同意学生自愿退学，本人已充分知悉后果。"],
      ["archive-risk", "心理标签", "对帮助抵触，反复申诉，网络言论风险偏高。"]
    ];
    return h`
      ${header("归档预览缓存", "只读缓存。入口来自邮箱转发规则 xg413_archive / AUDIT-QCU-2026-0713。", `<span class="tag warn">缓存页</span>`)}
      <div class="panel-body">
        <div class="card">
          <div class="card-head">来源片段 <span class="tag ${state.archiveFields.length >= 3 || has("e14") ? "ok" : "warn"}">${Math.min(state.archiveFields.length, 3)}/3</span></div>
          <div class="card-body">
            <div class="archive-stack">
              ${fields.map(([id, label, text]) => `
                <button class="archive-field ${state.archiveFields.includes(id) ? "selected" : ""}" data-action="${id}">
                  <span>${label}</span>
                  <strong>${text}</strong>
                </button>`).join("")}
            </div>
            <div class="actions" style="margin-top:10px">
              <button data-action="archive-compare" ${state.archiveFields.length >= 3 || has("e14") ? "" : "disabled"}>${has("e14") ? "重新生成归档输出" : "生成归档输出"}</button>
            </div>
            ${!has("e14") && state.archiveFields.length < 3 ? `<p class="muted">标记 3 个来源片段后，可生成归档输出。</p>` : ""}
            ${has("e14") ? `<div class="red-note">归档输出不是来自同一个端口、同一次沟通或同一种确认，而是跨端口拼接后的模板结果。</div>` : ""}
          </div>
        </div>
        ${has("e14") ? `<div class="card" style="margin-top:12px">
          <div class="card-head">归档预览输出</div>
          <div class="card-body">
            <div class="archive-output">
              <div><span>预览编号</span><strong>AUDIT-QCU-2026-0713</strong></div>
              <div><span>材料来源</span><strong>邮箱转发规则、谈话摘要、家长端回执、心理风险提示</strong></div>
              <div><span>归档输出</span><strong>学生长期无法适应当前学习生活，经家长知情、学院沟通及心理风险提示后，同意自愿退学。</strong></div>
            </div>
            <div class="actions">
              <button data-action="open-review-from-archive">转入终审复核</button>
            </div>
          </div>
        </div>` : ""}
      </div>`;
  }

  root.VoluntaryLeaveCoreViews = {
    renderAcademic,
    renderMaterials,
    renderMaterialTab,
    renderStudent,
    renderArchive
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.VoluntaryLeaveCoreViews;
  }
})(typeof window !== "undefined" ? window : globalThis);
