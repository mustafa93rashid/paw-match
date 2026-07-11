const cookieConfig = {
  httpOnly: true,
  secure: false,
  sameSite: "strict",
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
    res.clearCookie(key);
  };

  setAccessToken = (res, value) => {
    res.cookie("accessToken", value, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
      maxAge: 60 * 60 * 1000, // 1 hour
    });
  };

  setRefreshToken = (res, value) => {
    res.cookie("refreshToken", value, {
      httpOnly: true,
      secure: false,
      sameSite: "strict",
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
