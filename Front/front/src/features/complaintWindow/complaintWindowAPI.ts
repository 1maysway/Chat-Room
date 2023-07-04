import { Complaint } from "../../types/simplifiedDatabaseTypes";
import config from "../../config.json";
import Cookies from "universal-cookie";
import { axiosClient } from "../../Utils";

export const createComplaint = async (complaint: Complaint) => {
  const cookie = new Cookies();
  const access_token = cookie.get("acs");

  return await axiosClient.post(
    config.SERVER_BASE_URL + "complaint/create",
    { complaint, access_token },
    {
      headers: {
        Authorization: access_token,
      },
    }
  );
};
