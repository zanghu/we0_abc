import https from 'https';
import crypto from 'crypto';

// 获取日期
function getDate(timestamp) {
  const date = new Date(timestamp * 1000);
  const year = date.getUTCFullYear();
  const month = ('0' + (date.getUTCMonth() + 1)).slice(-2);
  const day = ('0' + date.getUTCDate()).slice(-2);
  return `${year}-${month}-${day}`;
}

// 计算 HMAC-SHA256
function sha256(message, secret = '', encoding) {
  const hmac = crypto.createHmac('sha256', secret);
  return hmac.update(message).digest(encoding);
}

// 获取 SHA256 Hash
function getHash(message, encoding = 'hex') {
  const hash = crypto.createHash('sha256');
  return hash.update(message).digest(encoding);
}

// 腾讯云翻译请求函数
export function sendTranslationRequest(payload) {
  const SECRET_ID = 'AKIDobBXgdNuFNLFH9pO4jQvDNXbUAcw52nL';  // 请替换为实际 SecretId
  const SECRET_KEY = 'OZWFl375qOit1zsdDZkiW8XiiW8Ymrvr';  // 请替换为实际 SecretKey
  const TOKEN = '';  // 如果有 Token，可以设置，没用就留空

  const host = 'tmt.tencentcloudapi.com';
  const service = 'tmt';
  const region = 'ap-guangzhou';  // 默认地区，可根据需要修改
  const action = 'TextTranslateBatch';  // API 动作
  const version = '2018-03-21';
  const timestamp = Math.floor(Date.now() / 1000);  // 当前时间戳
  const date = getDate(timestamp);  // 获取当前日期，格式：YYYY-MM-DD

  const signedHeaders = 'content-type;host';
  const hashedRequestPayload = getHash(payload);
  const httpRequestMethod = 'POST';
  const canonicalUri = '/';
  const canonicalQueryString = '';
  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${host}\n`;

  const canonicalRequest =
    `${httpRequestMethod}\n` +
    `${canonicalUri}\n` +
    `${canonicalQueryString}\n` +
    `${canonicalHeaders}\n` +
    `${signedHeaders}\n` +
    `${hashedRequestPayload}`;

  const algorithm = 'TC3-HMAC-SHA256';
  const hashedCanonicalRequest = getHash(canonicalRequest);
  const credentialScope = `${date}/${service}/tc3_request`;
  const stringToSign =
    `${algorithm}\n` +
    `${timestamp}\n` +
    `${credentialScope}\n` +
    `${hashedCanonicalRequest}`;

  const kDate = sha256(date, 'TC3' + SECRET_KEY);
  const kService = sha256(service, kDate);
  const kSigning = sha256('tc3_request', kService);
  const signature = sha256(stringToSign, kSigning, 'hex');

  const authorization =
    `${algorithm} ` +
    `Credential=${SECRET_ID}/${credentialScope}, ` +
    `SignedHeaders=${signedHeaders}, ` +
    `Signature=${signature}`;

  const headers = {
    Authorization: authorization,
    'Content-Type': 'application/json; charset=utf-8',
    Host: host,
    'X-TC-Action': action,
    'X-TC-Timestamp': timestamp,
    'X-TC-Version': version,
  };

  if (region) {
    headers['X-TC-Region'] = region;
  }
  if (TOKEN) {
    headers['X-TC-Token'] = TOKEN;
  }

  const options = {
    hostname: host,
    method: httpRequestMethod,
    headers,
  };

  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        resolve(data);
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(payload);
    req.end();
  });
}
