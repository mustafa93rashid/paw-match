const isProduction = process.env.NODE_ENV === "production";

const baseCookieConfig = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
};

const cookieConfig = {
  ...baseCookieConfig,
  maxAge: 15 * 60 * 1000, // 15 minutes
};

class CookiesService {
  getData = (req, key) => {
    return req.cookies[key];
  };

  setData = (res, key, value) => {
    res.cookie(key, value, cookieConfig);
  };

  clearData = (res, key) => {
    res.clearCookie(key, baseCookieConfig);
  };

  setAccessToken = (res, value) => {
    res.cookie("accessToken", value, {
      ...baseCookieConfig,
      maxAge: 60 * 60 * 1000, // 1 hour
    });
  };

  setRefreshToken = (res, value) => {
    res.cookie("refreshToken", value, {
      ...baseCookieConfig,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
  };

  getAccessToken = (req) => {
    return req.cookies["accessToken"];
  };

  getRefreshToken = (req) => {
    return req.cookies["refreshToken"];
  };

  clearTokens = (res) => {
    this.clearData(res, "accessToken");
    this.clearData(res, "refreshToken");
  };
}

module.exports = new CookiesService();