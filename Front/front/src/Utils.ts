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
