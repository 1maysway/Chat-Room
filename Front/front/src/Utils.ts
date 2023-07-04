import axios from "axios";
import Cookies from "universal-cookie";
import { useAppDispatch } from "./app/hooks";
import { showNotification } from "./features/notification/notificationSlice";
import { store } from "./app/store";

export const convertDateTime = (dateTimeString: string, timeZone: number) => {
  const dateTime = new Date(dateTimeString);
  const offset = dateTime.getTimezoneOffset() * 60 * 1000; // Получаем разницу в минутах между локальным временем и UTC

  // Создаем новый объект Date, добавляя разницу по времени между UTC и указанным часовым поясом
  const convertedDateTime = new Date(
    dateTime.getTime() + offset + timeZone * 60 * 60 * 1000
  );

  // Возвращаем объект с конвертированной датой
  return {
    year: convertedDateTime.getFullYear(),
    month: convertedDateTime.getMonth() + 1, // Месяцы в JavaScript начинаются с 0, поэтому добавляем 1
    day: convertedDateTime.getDate(),
    hour: convertedDateTime.getHours(),
    minute: convertedDateTime.getMinutes(),
    second: convertedDateTime.getSeconds(),
  };
};

export const padZeroes = (number: number) => {
  return number.toString().padStart(2, "0");
};

const axiosClient = axios.create({
  withCredentials: true,
  headers: {
    rememberBrowser: "false",
  },
});

axiosClient.interceptors.response.use(
  (res) => {
    if (res.data?.data?.message) {
      const message = res.data.data.message;
      store.dispatch(
        showNotification({ message: message.content, type: message.type })
      );
    }

    return res;
  },
  (err) => {
    console.log(err);

    if (err.response.data?.data?.message) {
      const message = err.response.data.data.message;
      store.dispatch(
        showNotification({ message: message.content, type: message.type })
      );
    }

    switch (err.response.status) {
      case 403: {
        window.location.assign('/');
        break;
      }
    }

    return Promise.reject(err);
  }
);

export { axiosClient };

export const millisecondsToTime = (ms: number) => {
  const hours = Math.floor(ms / (1000 * 60 * 60));
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((ms % (1000 * 60)) / 1000);
  const milliseconds = ms % 1000;

  return {
    hours,
    minutes,
    seconds,
    milliseconds,
  };
};

export const millisecondsToTimeStrings = (ms: number) => {
  const { hours, minutes, seconds, milliseconds } = millisecondsToTime(ms);

  return {
    hours: hours < 10 ? `0${hours}` : hours,
    minutes: minutes < 10 ? `0${minutes}` : minutes,
    seconds: seconds < 10 ? `0${seconds}` : seconds,
    miliseconds:
      milliseconds < 10
        ? `00${milliseconds}`
        : milliseconds < 100
        ? `0${milliseconds}`
        : milliseconds,
  };
};

export const validateEmail = (email: string) => {
  const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
  return emailRegex.test(email);
};
