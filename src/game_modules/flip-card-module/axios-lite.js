const normaliseHeaders = (headers = {}) => {
  const result = { ...headers };
  if (!('Content-Type' in result)) {
    result['Content-Type'] = 'application/json';
  }
  return result;
};

const axios = {
  async post(url, payload, options = {}) {
    const headers = normaliseHeaders(options.headers);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: payload instanceof FormData ? payload : JSON.stringify(payload ?? {}),
    });

    const responseText = await response.text();
    let data;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch (error) {
      data = responseText;
    }

    return {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data,
    };
  },
};

export default axios;
