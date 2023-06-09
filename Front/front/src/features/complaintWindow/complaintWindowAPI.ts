import axios from "axios";
import { Complaint } from "../../types/simplifiedDatabase";
import config from "../../config.json";
import Cookies from "universal-cookie";

export const createComplaint = async (complaint: Complaint) => {
  const cookie = new Cookies();
  const access_token = cookie.get("acs");

  return await axios.post(
    config.SERVER_BASE_URL + "complaint/create",
    { complaint, access_token },
    {
      headers: {
        Authorization: access_token,
      },
    }
  );
};
