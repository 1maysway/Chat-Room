import Cookies from "universal-cookie";
import config from "../../config.json";
import { useNavigate } from "react-router-dom";
import { axiosClient } from "../../Utils";

//////////////////////

export const authentication = async () => {
  try {
    // const cookie = new Cookies();
    // const access_token = cookie.get("acs");
    // const refresh_token = cookie.get('rfs');

    // console.log(access_token);

    // if (!access_token && !refresh_token) {
    //   return {
    //     loggedIn: false,
    //     info: null,
    //   };
    // }

    return (
      await axiosClient.post(config.SERVER_BASE_URL + "auth")
    ).data.data;
  } catch (error) {
    console.error(error);

    return {
      loggedIn: false,
      info: null,
    };
  }

  // return new Promise<User>((resolve=>{
  //     setTimeout(() => resolve({ loggedIn:false,info:{
  //         id:1,
  //         username:"maysway",
  //         avatarUrl:"https://i.pinimg.com/736x/06/9a/ac/069aac9fecd84bd139ecc2d8aa67ac61.jpg"
  //     }}), 1500)
  // }))
};

export const logIn = async (email: string, password: string) => {
  try {
    // const cookie = new Cookies();

    const res = await axiosClient.post(config.SERVER_BASE_URL + "auth/login", {
      email,
      password,
    });

    // if(res.status===200){
    //     cookie.set('acs',res.data.data.access_token);
    //     cookie.set('rfs',res.data.data.refresh_token);
    // }

    return res;
  } catch (e) {
    return e;
  }
};

export const register = async (
  email: string,
  password: string,
  username: string
) => {
    try {
        const res = await axiosClient.post(config.SERVER_BASE_URL + "auth/register", {
          email,
          password,
          username
        });
    
        return res;
      } catch (e) {
        return e;
      }
};

export const twoStep = async (user_id:number,confirmCode:string) => {
  try {
    const res = await axiosClient.post(config.SERVER_BASE_URL + "auth/two-step", {
      user_id,
      confirmCode,
    });

    return res;
  } catch (e) {
    return e;
  }
}
