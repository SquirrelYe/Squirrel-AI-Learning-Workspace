/**
 * @description 工具类
 * @author 风继续吹<will>
 * @time 2025.09.09 19:20:50
 */
export class Tools {
  // 工具模拟：天气和时间
  public static getWeather(location: string, unit: string = 'celsius') {
    const weatherInfo = {
      北京: { temperature: 26, unit, description: '晴天' },
      上海: { temperature: 28, unit, description: '多云' }
    };
    return weatherInfo[location] || { error: '未知地点' };
  }

  public static getDatetime(format?: string) {
    const now = new Date();
    if (!format) {
      return now.toISOString();
    }
    const pad = (n: number) => n.toString().padStart(2, '0');
    return format
      .replace('yyyy', now.getFullYear().toString())
      .replace('MM', pad(now.getMonth() + 1))
      .replace('dd', pad(now.getDate()))
      .replace('HH', pad(now.getHours()))
      .replace('mm', pad(now.getMinutes()))
      .replace('ss', pad(now.getSeconds()));
  }
}
