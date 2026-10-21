import { createWorkBuddyCloud } from '@tencent-ai/workbuddy-cloud-sdk';

// 云服务单点初始化：endpoint / publishableKey 必须同时给，缺一个就调不通。
// 这两个值来自开通时返回的 publicConfig，别从 window.location 或环境变量里猜。
const publicConfig = {
  endpoint: 'https://campus-toolbox-20868.app.workbuddy.host',
  publishableKey: 'wbpk_t1i5ZUPTQqJnuAbXSPAtxb_Z5wPcl4qYVWH8Yk5i3AQc0kL3SRlCdwe'
};

const cloud = createWorkBuddyCloud({
  endpoint: publicConfig.endpoint,
  publishableKey: publicConfig.publishableKey
});

export default cloud;
