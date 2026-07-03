(function (root) {
  function renderAffairs(ctx) {
    const { h, header, has } = ctx;
    return h`
      ${header("学生事务服务大厅", "志愿服务、勤工助学、材料证明与历史版本查询。", `<span class="tag">PORTAL-STU</span>`)}
      <div class="panel-body">
        <section class="portal-home">
          <div class="portal-feature portal-feature-affairs">
            <img src="./assets/portal_generated/portal_affairs_hero.jpg" alt="学生事务材料室" />
            <div class="portal-feature-copy">
              <span>学生事务 / 志愿服务</span>
              <h2>2026 春季学生事务志愿服务时长公示</h2>
              <p>本期公示包含迎新咨询、材料电子化、档案整理和学生组织证明协助等岗位。</p>
              <button class="primary" data-action="mengqing-volunteer">查看公示名单</button>
            </div>
          </div>
          <aside class="portal-side">
            <div class="portal-side-head">本页入口</div>
            <button data-action="xzy-draft">材料归档历史版本查询</button>
            <button data-screen="work">学生状态关怀记录核对</button>
          </aside>
        </section>
        <section class="portal-sections">
          <div class="portal-news">
            <div class="portal-section-title"><strong>重点动态</strong><span>2 条</span></div>
            <article class="portal-news-card">
              <img src="./assets/portal_generated/portal_mengqing_volunteer_thumb.jpg" alt="学生事务系统截图" />
              <div>
                <span>06-21</span>
                <h3><button class="inspect-token ${has("e15") ? "marked" : ""}" data-action="mengqing-volunteer">学生事务材料电子化志愿服务优秀候选公示</button></h3>
                <p>孟清负责处分、申诉、推免复核旧档扫描及编号补录，推荐评语为“熟悉学生事务归档流程”。</p>
              </div>
            </article>
          </div>
          <div class="portal-notice-board">
            <div class="portal-section-title"><strong>材料证明</strong><span>历史版本</span></div>
            <ul class="portal-list">
              <li><strong>勤工助学</strong><span>本周岗位结算已开放查询。</span></li>
              <li><strong>材料证明</strong><span>学生组织证明可在线申请。</span></li>
            </ul>
            <div class="actions"><button data-action="xzy-draft">查看谈话材料历史版本</button></div>
            ${has("e15") ? `<div class="archive-result" style="margin-top:10px"><div>交接记录：GCZ-2024-discipline-withdraw 由学院学生工作办公室接收。</div><div>同批缓存：recommend_rank_cache 由学院学生工作办公室接收。</div><div>接收人：周启明。</div></div>` : ""}
            ${has("e16") ? `<div class="archive-result" style="margin-top:10px"><div>历史草稿：事项范围为课程退选与休整说明。</div><div>撤回记录：xzy_admin 撤回原草稿。</div><div>补录结果：学院学生工作办公室补录为离校意愿。</div></div>` : ""}
          </div>
        </section>
      </div>`;
  }

  function renderWork(ctx) {
    const { state, h, header, has, inspected, renderRiskLogs } = ctx;
    return h`
      ${header("学工服务与学生关怀平台", "申诉工单、自动关怀、处分预警与学生画像。", `<span class="tag">CARE-RISK</span>`)}
      <div class="panel-body">
        <section class="portal-home">
          <div class="portal-feature portal-feature-work">
            <img src="./assets/portal_generated/portal_work_hero.jpg" alt="学生关怀画像" />
            <div class="portal-feature-copy">
              <span>一站式学生社区 / 关怀平台</span>
              <h2>学生状态研判与家校协同服务</h2>
              <p>平台汇总请假、咨询、申诉、网络言论和夜间出入记录，供辅导员回访时参考。</p>
              <button class="primary" data-action="work-profile">${inspected("life-fragments") ? "已展开学生画像摘要" : "查看学生画像摘要"}</button>
            </div>
          </div>
          <aside class="portal-side">
            <div class="portal-side-head">本页入口</div>
            <button data-action="open-student-system">进入学工系统</button>
          </aside>
        </section>
        <section class="portal-sections">
          <div class="portal-news">
            <div class="portal-section-title"><strong>核心记录</strong><span class="tag ${inspected("life-fragments") ? "ok" : "warn"}">${inspected("life-fragments") ? "已查看" : "待查看"}</span></div>
            <article class="portal-news-card">
              <img src="./assets/portal_generated/portal_care_dashboard_thumb.jpg" alt="家校协同摘要" />
              <div>
                <span>学生画像摘要</span>
                <h3><button class="inspect-token ${inspected("life-fragments") ? "marked" : ""}" data-action="work-profile">课程留言、拒填量表、夜间出入与论坛发帖</button></h3>
                <p>几条普通生活记录被放在同一张表里，读起来就变成了“终止学业意愿”。</p>
              </div>
            </article>
            ${inspected("life-fragments") ? `<div class="archive-result" style="margin-top:10px">
              <div>课程留言：林华灿说“不想继续了”，指的是课程项目。</div>
              <div>量表记录：拒填心理量表被归入“抵触帮助”。</div>
              <div>夜间出入：B4 与校医院记录被合并为异常出入。</div>
              <div>论坛发帖：询问顾天泽处分预警，被记为传播未经核实信息。</div>
            </div>` : ""}
          </div>
          <div class="portal-notice-board">
            <div class="portal-section-title"><strong>最新关怀</strong><span>系统生成</span></div>
            ${state.riskLogs.length ? renderRiskLogs() : `<p class="muted" style="padding:10px">暂无新增关怀记录。</p>`}
          </div>
        </section>
        ${inspected("flow-loop") || has("e07") ? `<div class="card" style="margin-top:12px"><div class="card-head">流转图摘要</div><div class="card-body"><p class="muted">学工服务页只显示关怀平台的流程摘要。正式责任单位、处理依据和重复 IP 需要进入“学工系统”的工单日志核验。</p><div class="actions"><button class="primary" data-action="open-student-system">进入学工系统核验</button></div></div></div>` : ""}
      </div>`;
  }

  function renderLife(ctx) {
    const { state, h, header, has } = ctx;
    return h`
      ${header("校园生活与学院风采", "校园新闻、竞赛获奖、奖学金公示与志愿活动。", `<span class="tag">NEWS</span>`)}
      <div class="panel-body">
        <section class="portal-home">
          <div class="portal-feature portal-feature-life">
            <img src="./assets/portal_generated/portal_life_hero.jpg" alt="校园活动新闻图" />
            <div class="portal-feature-copy">
              <span>学院风采 / 优秀学生</span>
              <h2>信管学院学生团队完成学生事务数据治理演示</h2>
              <p>项目展示学生代表顾天泽分享“信息化实践贡献”经验，学院领导出席活动。</p>
              <button class="primary" data-action="gu-news">查看新闻详情</button>
            </div>
          </div>
          <aside class="portal-side">
            <div class="portal-side-head">本页入口</div>
            <button data-action="gu-news">信息化实践贡献专项加分公示</button>
          </aside>
        </section>
        <section class="portal-sections">
          <div class="portal-news">
            <div class="portal-section-title"><strong>重点新闻</strong><span>1 条</span></div>
            <article class="portal-news-card">
              <img src="./assets/portal_generated/portal_gu_award_thumb.jpg" alt="推免候选缓存截图" />
              <div>
                <span>06-20 / 奖学金与竞赛</span>
                <h3><button class="inspect-token ${state.guTimelineVisible ? "marked" : ""}" data-action="gu-news">顾天泽同学获信息化实践贡献专项加分</button></h3>
                <p>附件为 <button class="text-link ${has("e18") ? "marked" : ""}" data-action="gu-news">信息化实践贡献加分名单最终版</button>，需结合新闻发布时间和候选资格节点核验。</p>
              </div>
            </article>
            ${has("e18") ? `<div class="notice" style="margin-top:12px">新闻附件已核验，可在本地取证夹查看证据 18。</div>` : ""}
          </div>
          <div class="portal-notice-board">
            <div class="portal-section-title"><strong>校园日常</strong><span>普通噪音</span></div>
            <ul class="portal-list">
              <li><strong>宿舍文化节</strong><span>优秀寝室展示与楼栋自治经验交流。</span></li>
              <li><strong>食堂二楼改造</strong><span>06-25 起试运行错峰取餐动线。</span></li>
            </ul>
            ${has("e18") ? `<div class="red-note">新闻附件显示：专项加分公示紧跟在处分预警撤回、成绩补录和推免候选资格复核之后。</div>` : ""}
          </div>
        </section>
      </div>`;
  }

  function renderPublic(ctx) {
    const { state, h, header, has } = ctx;
    const recommendCacheReady = has("e09") && state.studentStatusRestored;
    const recommendCacheStatus = has("e21")
      ? "已核验"
      : recommendCacheReady
        ? "可核验"
        : state.studentStatusRestored
          ? "需 B4 来源"
          : "复学后可见";
    const recommendCacheHint = recommendCacheReady
      ? "已具备在籍权限和 B4 调阅来源，可核验候选池缓存版本。"
      : state.studentStatusRestored
        ? "公开页只显示最终名单，不显示候选池缓存版本。需要先取得 B4 调阅来源。"
        : "当前账号仍处于离校过渡期，只能看到最终名单。候选池缓存需恢复在籍权限后核验。";
    return h`
      ${header("信息公开", "采购公示、会议纪要、推免政策与公开事项查询。", `<span class="tag">OPEN-INFO</span>`)}
      <div class="panel-body">
        <section class="portal-open-banner">
          <div>
            <span>信息公开 · 竞争公平 · 结果公正</span>
            <h2>青川大学公开事项查询</h2>
            <p>采购、招标、政策修订和会议纪要按事项类别公开。</p>
          </div>
        </section>
        <section class="portal-service-grid public-services">
          <button data-action="public-chain"><span>采</span><strong>采购公示</strong></button>
          <button data-action="${has("e09") && state.studentStatusRestored ? "search-recommend-cache" : "recommend-cache-locked"}"><span>推</span><strong>推免候选</strong></button>
          <button data-action="public-chain"><span>纪</span><strong>会议纪要</strong></button>
        </section>
        <section class="portal-sections">
          <div class="portal-news">
            <div class="portal-section-title"><strong>公开事项</strong><span>重点</span></div>
            <article class="portal-news-card compact">
              <img src="./assets/portal_generated/portal_public_icon_tiles.jpg" alt="公开事项流程图" />
              <div>
                <span>06-21 / 采购公示</span>
                <h3><button class="inspect-token ${has("e19") ? "marked" : ""}" data-action="public-chain">学生事务数字化治理试点二期采购公示</button></h3>
                <p>公开附件包含采购结果、合作备案和项目会议纪要。需打开附件交叉核验。</p>
              </div>
            </article>
            ${has("e19") ? `<div class="notice" style="margin-top:12px">公开附件关系已核验，可在本地取证夹查看证据 19。</div>` : ""}
          </div>
          <div class="portal-notice-board">
            <div class="portal-section-title"><strong>推免候选缓存</strong><span>${recommendCacheStatus}</span></div>
            ${has("e21") ? `<div class="archive-result">
              <div>推免候选排名缓存 · 来源：信息公开缓存版本 / B4 调阅来源交叉核验</div>
              <div>缓存 A / 2026-06-18 23:40：林华灿 排名 12，顾天泽 排名 13，顾天泽后补成绩待复核。</div>
              <div>缓存 B / 2026-06-19 09:11：林华灿状态写入离校过渡期，系统自动剔除候选资格。</div>
              <div>缓存 B / 2026-06-19 09:12：顾天泽排名上移，信息化实践贡献加分附件改为已确认。</div>
              <div>缓存备注：候选人需具备持续在校培养条件，学生状态异常可自动触发候选资格移除。</div>
            </div>` : `<div class="muted" style="padding:10px">
              <p style="margin:0">${recommendCacheHint}</p>
              ${recommendCacheReady ? `<div class="actions" style="margin-top:10px"><button class="primary" data-action="search-recommend-cache">核验推免候选缓存</button></div>` : ""}
            </div>`}
            ${state.studentStatusRestored ? `<div class="restored-material">
              <strong>复学后可见：周启明会议纪要完整 OCR</strong>
              <p>当前学籍状态已恢复为在籍，可核验此前被折叠的会议纪要附件。</p>
              <div class="actions"><button class="primary" data-action="public-full-ocr">${has("e20") ? "重新查看完整 OCR" : "查看完整 OCR"}</button></div>
              ${has("e20") ? `<div class="archive-result"><div>会议议题：学生状态同步异常与候选池刷新顺序。</div><div>参会单位：教务处、学工部、信息办、学院学生工作办公室。</div><div>纪要意见：单端材料不得直接定性，需保留来源端口和生成时间。</div><div>待办事项：候选池刷新前，先完成学生状态回滚或冻结说明。</div><div>周启明批注：先处理状态，再刷新候选池。</div></div>` : ""}
            </div>` : ""}
          </div>
        </section>
      </div>`;
  }

  root.VoluntaryLeavePortalViews = {
    renderAffairs,
    renderWork,
    renderLife,
    renderPublic
  };

  if (typeof module !== "undefined" && module.exports) {
    module.exports = root.VoluntaryLeavePortalViews;
  }
})(typeof window !== "undefined" ? window : globalThis);
