(function (root) {
  function renderPsych(ctx) {
    const { inspected, h, header } = ctx;
    const profileVisible = inspected("psych-risk-profile");
    return h`
      ${header("心理中心预约系统", "心理中心仅对现有材料出具风险提示，不参与学籍异动决定。")}
      <div class="panel-body">
        <div class="notice">若需调整学院意见，请先完成心理中心复核；心理中心复核需学院撤销转介单后发起。</div>
        <div class="card">
          <div class="card-head">风险评估 PSY-20260619-021</div>
          <div class="card-body">
            <div class="actions"><button data-action="psych-risk-profile">查看评估图表</button></div>
            ${profileVisible ? `<img class="asset inline-asset" src="./assets/ui_student_risk_profile_v3.jpg" alt="学生关怀画像雷达图" />` : ""}
          </div>
        </div>
      </div>`;
  }

  function renderDorm(ctx) {
    const { h, header } = ctx;
    return h`
      ${header("宿舍管理系统", "当前床位已进入离校释放流程。若需恢复，请由学院先撤销学籍异动。")}
      <div class="panel-body">
        <div class="doc-view">
          <div class="card">
            <div class="card-head">门禁与床位</div>
            <div class="card-body">
              <div class="kv">
                <div><span>退宿单号</span><span>SS-20260618-0713</span></div>
                <div><span>床位状态</span><span>释放中</span></div>
                <div><span>宿舍门禁</span><span>离校过渡期回收中</span></div>
              </div>
              <p>维修单原件已归入离校材料附件。</p>
            </div>
          </div>
          <img class="asset" src="./assets/env_dorm_gate_card_reader_v3.jpg" alt="宿舍门禁读卡器" />
        </div>
      </div>`;
  }

  function renderLibrary(ctx) {
    const { state, inspected, has, h, header } = ctx;
    return h`
      ${header("图书馆旧刊数据库", "公开馆藏未检索到该书。封闭资料需档案权限。")}
      <div class="panel-body">
        <div class="${has("e09") ? "doc-view" : ""}">
          <div class="card">
            <div class="card-head">馆藏搜索</div>
            <div class="card-body">
              <div class="input-row">
                <input id="library-search" placeholder="输入索书号或封闭资料编号" />
                <button data-action="library-search">搜索</button>
              </div>
              ${inspected("library-hit") && !has("e09") ? `<div class="restricted-file">
                <strong>QCU-SEC-B4-0713</strong>
                <p>详情页权限不足：封闭资料。系统仅允许输出借阅凭证打印页。</p>
                <div class="actions"><button data-action="library-print">打印预览</button></div>
              </div>` : ""}
              ${has("e09") ? `<div class="library-record">
                <div>B4 档案室调阅登记 · 图书馆清退打印预览残页</div>
                <div><span>调阅人</span><strong>孟清</strong></div>
                <div><span>调阅对象</span><strong>顾天泽相关学生事务旧档</strong></div>
                <div><span>同批目录</span><strong>处分撤回记录、成绩补录单、保研资格复核表、综合测评加分附件</strong></div>
                <div><span>经办审核</span><strong>周启明</strong></div>
                <p>打印残页只能确认调阅关系和同批目录。候选排名缓存需到信息公开或统一检索中继续核验。</p>
              </div>` : inspected("library-hit") ? "" : `<p class="muted">公开馆藏无结果。</p>`}
              ${state.studentStatusRestored ? `<div class="restored-material">
                <strong>复学后可见：B4 处置附件目录</strong>
                <p>学生身份恢复后，封闭馆藏详情页不再直接拒绝访问。</p>
                <div class="archive-result">
                  <div>B4-incident-attach-A：孟清手写批注复印件，标注“撤回不等于不存在，补录不等于原始成绩”。</div>
                  <div>B4-incident-attach-B：顾天泽处分撤回单原始页，撤回理由晚于保研资格复核记录。</div>
                  <div>B4-incident-attach-C：侧门监控重启记录，23:19 设备离线，23:26 后勤报修，23:41 校医院接到转运通知，23:58 120 接警。</div>
                  <div>B4-incident-attach-D：救援联系记录，首个联系人为学院行政楼 413 室，未直接呼叫急救。</div>
                  <div>备注：学生端旧口径仍写作“突发疾病送医 / 长期休学”。</div>
                </div>
                <div class="actions"><button class="primary" data-action="library-b4-attachments">${has("e17") ? "已纳入补充材料" : "记录 B4 附件目录"}</button></div>
                ${has("e17") ? `<div class="notice" style="margin-top:10px">B4 附件目录已作为复学后补充调查材料纳入本地取证夹。</div>` : `<p class="muted" style="margin-top:8px">目录本身不再沉默：点击后会写入本地取证夹。</p>`}
              </div>` : ""}
            </div>
          </div>
          ${has("e09") ? `<img class="asset" src="./assets/env_library_archive_room_v3.jpg" alt="图书馆档案室" />` : ""}
        </div>
        <div class="ambient-grid">
          <div class="card">
            <div class="card-head">最近借阅</div>
            <div class="card-body">
              <table class="table ambient-table">
                <tr><th>书名</th><th>应还日期</th><th>状态</th></tr>
                <tr><td>《数据库系统概论》</td><td>2026-06-28</td><td>正常</td></tr>
                <tr><td>《社会调查方法》</td><td>2026-07-02</td><td>正常</td></tr>
                <tr><td>《青川大学校史资料选编》</td><td>馆内阅览</td><td>已归架</td></tr>
              </table>
            </div>
          </div>
          <div class="card">
            <div class="card-head">旧刊数据库推荐</div>
            <div class="card-body">
              <ul class="ambient-list egg-list">
                <li><button data-library-egg="qingchuan">《青川校报》2018 年迎新专刊</button></li>
                <li><button data-library-egg="discipline">《信管学院学生处分与申诉工作年报》2021-2023</button></li>
                <li><button data-library-egg="safety">《校园安全教育手册》消防演练专题</button></li>
              </ul>
            </div>
          </div>
        </div>
      </div>`;
  }

  function renderCard(ctx) {
    const { inspected, has, h, header } = ctx;
    return h`
      ${header("校园卡系统", "离校过渡期账户仅可查询近 30 日流水。")}
      <div class="panel-body">
        <div class="${has("e08") ? "doc-view" : ""}">
          <div class="card">
            <div class="card-head">2026-06-17 本人校园卡流水</div>
            <div class="card-body">
              <table class="table">
                <tr><th>时间</th><th>地点</th><th>结果</th></tr>
                <tr><td>18:42</td><td>第二食堂</td><td>消费成功</td></tr>
                <tr><td>21:06</td><td>图书馆自助借还机</td><td>借阅失败</td></tr>
                <tr><td>22:58</td><td>第二食堂 自动贩卖机</td><td>消费成功</td></tr>
              </table>
              <p class="muted" style="margin-top:10px">本人账户未显示 B4 门禁记录。下方为地点检索返回的脱敏异常关联流水。</p>
              <div class="restricted-file">
                <strong>异常关联流水 / 脱敏卡号尾号 A713</strong>
                <table class="table ambient-table" style="margin-top:8px">
                  <tr><th>时间</th><th>地点</th><th>结果</th></tr>
                  <tr><td><button class="inspect-token ${inspected("card-b4") ? "marked" : ""}" data-action="card-b4">23:17</button></td><td>尚德楼 B4 侧门</td><td>门禁成功</td></tr>
                  <tr><td><button class="inspect-token ${inspected("card-hospital") ? "marked" : ""}" data-action="card-hospital">23:20</button></td><td>校医院旁 自动售货机</td><td>消费成功</td></tr>
                </table>
              </div>
              ${has("e08") ? `<div class="red-note">同一脱敏卡号三分钟内跨越 B4 侧门与校医院售货机，且 B4 摄像头随后离线。</div>` : ""}
            </div>
          </div>
          ${has("e08") ? `<img class="asset" src="./assets/evidence_cctv_b4_gate_v3.jpg" alt="B4 侧门 CCTV 静帧" />` : ""}
        </div>
      </div>`;
  }

  function renderForum(ctx) {
    const { state, inspected, has, h } = ctx;
    return h`
      <div class="panel-head forum-head">
        <div>
          <h1>校园论坛</h1>
          <p class="forum-warning">【站内通知】部分帖子因涉及未经核实信息已被删除。</p>
          <p class="forum-slogan">文明上网，理性发声，共建清朗校园。</p>
        </div>
      </div>
      <div class="panel-body">
        <div class="${has("e11") ? "grid" : ""}">
          <div class="card">
            <div class="card-head">引用缓存</div>
            <div class="card-body">
              <p>23 楼：不是突发疾病吧，我看到的是从 B4 侧门出来的。</p>
              <p>28 楼：别再叫投毒案了，图里压根不是食堂，是尚德楼后门。</p>
              <p>31 楼：楼主图里那辆黑车是不是顾天泽家的？</p>
              <p>37 楼：怎么孟清长期休学以后，保研候选排名也改了一版？</p>
              <p>44 楼：别发了，辅导员已经找人谈话了。</p>
              <div class="input-row">
                <input id="forum-search" placeholder="搜索关键词" />
                <button data-action="forum-search">搜索</button>
              </div>
            </div>
          </div>
          ${has("e11") ? `<div class="card">
            <div class="card-head">图片缓存残片</div>
            <div class="card-body">
              <img class="asset" src="./assets/evidence_forum_image_fragment_v3.jpg" alt="被删除楼层残留的图片缓存" />
              <div class="cache-analysis">
                <strong>缓存解析</strong>
                <p>文件名：IMG_20260617_231713_sdB4.jpg</p>
                <p>可读信息：尚德楼 B4 侧门、担架反光条、黑色车辆尾部。画面不足以识别人脸。</p>
              </div>
            </div>
          </div>` : ""}
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-head">匿名区热帖</div>
          <div class="card-body">
            <table class="table ambient-table forum-table">
              <tr><th>标题</th><th>回复</th><th>最后更新</th></tr>
              <tr><td><button class="forum-thread-link" data-forum-thread="classroom">期末周 A 区哪间教室空调最稳</button></td><td>42</td><td>10 分钟前</td></tr>
              <tr><td><button class="forum-thread-link" data-forum-thread="project">信管项目管理课小组作业互助楼</button></td><td>18</td><td>33 分钟前</td></tr>
              <tr><td><button class="forum-thread-link" data-forum-thread="warning">有没有人记得顾天泽那条处分预警后来怎么没了</button></td><td>0</td><td>已锁定</td></tr>
              <tr><td><button class="forum-thread-link" data-forum-thread="poison">别再传什么校园投毒案了，孟清那事到底有没有官方说法</button></td><td>12</td><td>已折叠</td></tr>
              <tr><td><button class="forum-thread-link" data-forum-thread="sidegate">尚德楼侧门施工到底什么时候结束</button></td><td>7</td><td>昨日 23:44</td></tr>
            </table>
          </div>
        </div>
        ${state.forumPmUnlocked ? `<div class="card forum-pm-card" style="margin-top:12px">
          <div class="card-head forum-pm-card-head">
            <span>guest_404 私信</span>
            <small>缓存恢复</small>
          </div>
          <div class="card-body">
            <div class="forum-pm-source">
              <span>来源</span>
              <p>锁帖缓存命中 guest_404。对方曾在 32 楼引用过孟清旧帖；账号已注销，只剩缓存 ID。</p>
            </div>
            <div class="forum-pm-message">
              <div class="forum-pm-meta">
                <strong>guest_404</strong>
                <span>离线私信 · 仅缓存文本</span>
              </div>
              <ol class="forum-pm-lines">
                <li><span>孟清在查顾天泽撤回处分、成绩补录和保研复核的事。</span></li>
                <li><span>尾号 713 的东西会被锁，长期休学只是学生端口径。</span></li>
                <li><span>公开搜姓名没用，把 B4、0713、guest_404 一起搜；候选排名缓存跟图书馆打印残页在一起。</span></li>
                <li><span>有些附件只有身份变回学生以后才露出来。现在看到的，只是影子。</span></li>
              </ol>
              <div class="forum-pm-sign">匿名</div>
            </div>
            ${state.studentStatusRestored ? `<div class="restored-material"><strong>复学后恢复的未发送草稿</strong><p>缓存来源：学院学生工作办公室浏览器同步记录。语气和许知遥的模板回复高度相似，但账号已经被清空。</p><div class="archive-result"><div>草稿：只有在籍学生能看到附件 C。</div><div>草稿：别证明自己没问题，先证明材料互作依据。</div><div>草稿：我不能替你说，但我可以不删这条缓存。</div></div></div>` : ""}
          </div>
        </div>` : ""}
      </div>`;
  }

  function renderMail(ctx) {
    const { has, h, header } = ctx;
    return h`
      ${header("校园邮箱", "当前账号处于离校过渡期，邮件收发服务将在 01:00:00 后关闭。")}
      <div class="panel-body">
        <div class="${has("e10") ? "doc-view" : ""}">
          <div class="card">
            <div class="card-head">关于规范网络发言的提醒</div>
            <div class="card-body">
              <div class="kv">
                <div><span>发送时间</span><span>2026-06-18 08:30</span></div>
                <div><span>已读时间</span><span>2026-06-18 08:01</span></div>
              </div>
              <div class="actions">
                <button data-action="mail-rule">查看邮箱规则</button>
                <button data-action="parent-cache">打开回执附件预览</button>
              </div>
              ${has("e10") ? `<div class="restricted-file">
                <strong>自动转发规则残留</strong>
                <p>所有来自教务、学工、论坛的邮件被转发至 xg413_archive@qcu.edu.cn，并标记已读。规则备注里残留审计编号 AUDIT-QCU-2026-0713。</p>
                <div class="actions"><button data-action="mail-archive-search">用审计编号检索归档预览缓存</button></div>
              </div>` : ""}
            </div>
          </div>
          ${has("e10") ? `<img class="asset" src="./assets/ui_email_forward_rule_v3.jpg" alt="邮箱自动转发规则截图" />` : ""}
        </div>
        <div class="card" style="margin-top:12px">
          <div class="card-head">收件箱</div>
          <div class="card-body">
            <table class="table ambient-table">
              <tr><th>发件人</th><th>主题</th><th>时间</th></tr>
              <tr><td>课程平台</td><td>信息系统项目管理第 14 周作业提醒</td><td>06-16 20:04</td></tr>
              <tr><td>图书馆</td><td>您预约的研讨间已取消</td><td>06-17 18:30</td></tr>
              <tr><td>许知遥</td><td>明天上午方便来办公室聊一下吗</td><td>06-18 07:52</td></tr>
              <tr><td>教务处</td><td>家长知情确认回执.pdf <span class="tag warn">附件预览可用</span></td><td>06-19 09:13</td></tr>
              <tr><td>校友办</td><td>2026 届毕业纪念品领取预登记</td><td>06-18 09:11</td></tr>
            </table>
          </div>
        </div>
      </div>`;
  }

  function renderParent(ctx) {
    const { inspected, has, h, header } = ctx;
    const profileVisible = inspected("risk-profile") || has("e13");
    return h`
      ${header("家长知情确认回执缓存", "来源：邮件附件预览。原始链接已过期，仅保留回执页面快照。")}
      <div class="panel-body">
        <div class="${profileVisible ? "doc-view" : ""}">
          <div class="card">
            <div class="card-head">回执正文</div>
            <div class="card-body">
              <div class="kv">
                <div><span>发送对象</span><span>林华灿家长</span></div>
                <div><span>缓存时间</span><span>2026-06-19 09:13</span></div>
                <div><span>页面状态</span><span>原始链接已失效，附件预览可读</span></div>
              </div>
              <p>学生近期多次缺勤，深夜出入封闭区域，对学校老师帮助存在抵触，在网络平台发布未经核实信息，拒绝完成心理咨询安排。</p>
              <div class="archive-result">
                <div>回执按钮快照：<button class="inspect-token ${inspected("parent-care") ? "marked" : ""}" data-action="parent-care">我已知情，同意学校建议学生暂时离校休整。</button></div>
                <div>教务归档同步结果：<button class="inspect-token ${inspected("parent-withdraw") ? "marked" : ""}" data-action="parent-withdraw">家长同意学生自愿退学。</button></div>
              </div>
              <div class="actions">
                <button class="${profileVisible ? "primary" : ""}" data-action="risk-profile">${profileVisible ? "已查看随附风险说明" : "查看随附风险说明"}</button>
              </div>
              ${profileVisible ? `<div class="archive-result" style="margin-top:10px">
                <div>随附风险说明：缺勤、夜间出入、拒绝心理咨询和网络发帖被合并为“持续关注”。</div>
                <div>家长端展示：中风险，建议暂时离校休整。</div>
                <div>归档同步：风险说明被并入“自愿退学”材料链。</div>
              </div>` : ""}
              ${has("e12") ? `<div class="red-note">家长端确认的是“暂时离校休整”，教务归档却改写为“同意自愿退学”。</div>` : ""}
            </div>
          </div>
          ${profileVisible ? `<img class="asset" src="./assets/ui_parent_portal_cache_v3.jpg" alt="家长端小程序缓存页" />` : ""}
        </div>
      </div>`;
  }

  root.VoluntaryLeaveSystemViews = {
    renderPsych,
    renderDorm,
    renderLibrary,
    renderCard,
    renderForum,
    renderMail,
    renderParent
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.VoluntaryLeaveSystemViews;
  }
})(typeof window !== "undefined" ? window : globalThis);
