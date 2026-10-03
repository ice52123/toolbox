// 统一响应格式。所有接口都走这两个函数，前端约定 { code, message, data }。
function ok(res, data = null, message = 'success') {
  return res.json({ code: 0, message, data });
}

function fail(res, message = 'error', code = 1, status = 200) {
  return res.status(status).json({ code, message, data: null });
}

module.exports = { ok, fail };
