/**
 * 说明
 * 1. 类型
 * 本地打印
 * weData全局日志上报
 * weData事件上报
 * weData过滤关键词
 *
 * 使用方式
 * vLog.log('vLog log信息 不上报')
 * vLog.info('vLog info信息 不上报')
 * vLog.warn('vLog 警告信息 不上报')
 * vLog.error('vLog 错误信息 不上报')
 *
 * vLog('直接用 不上报')
 *
 * vLog('直接用', '多组', [1, 3, 4], false, '多类型','不上报')
 *
 * 事件上报
 * name: reportWeData 固定值
 * eventName：reportEventName.※ 枚举类型 ✲ps: 事件暂未定义✲
 * info: 事件上报内容 Object类型
 * vLog({name: 'reportWeData', eventName: reportEventName.BI_wx_login, info: {key: 'Value'}})
 *
 * 日志上报
 * 调用 .report()方法
 * vLog.info('vLog ORIGIN qs.parse(options) >>>>', qs.parse(options)).report()
 *
 * 过滤关键字，最多不超过1Kb，可以在小程序管理后台根据设置的内容搜索得到对应的日志。
 * vLog.setFilterMsg('openid')
 *
 * 是setFilterMsg的添加接口。用于设置多个过滤关键字。
 * vLog.addFilterMsg('wechatInfoId')
 *
 */

const log = wx.getRealtimeLogManager ? wx.getRealtimeLogManager() : null

/**
 * 实体方法
 * @type {{reportWeData: string}}
 */
const VLOG_ENTRIES = {
  reportWeData: 'REPORT_WEDATA'
}

/**
 * 初始化本地打印的log输出颜色值
 * @type {{
 * LOG: string,
 * EVENT_REPORT: string,
 * ERROR: string,
 * TAG: string,
 * INFO: string,
 * WARN: string
 * }}
 */
const LOCAL_STATUS_COLOR = {
  'ERROR': 'red',
  'WARN': 'yellow',
  'INFO': '#c2c2c2',
  "LOG": 'white',
  'TAG': 'purple',
  'EVENT_REPORT': 'Beige'
}

const VLOG_CONFIG_FONT_SIZE = {
  small: 12,
  normal: 13,
  large: 14,
  big: 16
}

/**
 * 初始化vLog方法
 * @type {string[]}
 */
const VLOG_FUNC = ['log', 'info', 'warn', 'error', 'table']

/**
 * 格式化日志参数
 * @param args
 * @returns {*}
 */
function formatLogArgs(args) {
  return args.map((arg) => {
    if (typeof arg === 'object'){
      return JSON.stringify(arg, null, 2);
    }
    return arg;
  });
}

/**
 * 格式化日志内容
 * 返回
 * @param args
 * @returns {{logContent: *[], logMark: string}}
 */
function formatLogContent(args) {
  const logArgs = formatLogArgs(args);
  let logContent = [] // 打印的内容
  let logMark = '' // 打印的标识
  if (Array.isArray(logArgs) && logArgs.length > 1){
    let logList = logArgs.slice(1)
    logMark = logArgs[0]
    logList.forEach((item) => {
      if (!`${item}`.startsWith('{') && !`${item}`.startsWith('[')){
        logContent.push(item)
      } else {
        logContent.push(JSON.parse(item + '' || '{}'))
      }
    })
  }
  // 未填入时 用当前的调用的页面path代替
  if (!logMark){
    const pages = getCurrentPages();
    logMark = `${pages[pages.length - 1].route} : `;
  }
  // 合并日志内容
  if (!logArgs.length || !logContent.length){
    logContent = [].concat(logArgs, logContent)
  }

  return {
    logMark,
    logContent
  }
}

/**
 * 方法实体
 * @type {{doReport: {subscription: (function({}=): Promise<void>)}}}
 */
const consoleEntity = {
  [VLOG_ENTRIES.reportWeData]: {
    subscription: (event = {}) => {
      let {eventName = '', info = {}} = event
      eventName = `${eventName}`.toLocaleLowerCase()
      console.log(`%c ${eventName}`, `color:${LOCAL_STATUS_COLOR.EVENT_REPORT}`, info)
      return wx.reportEvent(eventName, {res: JSON.stringify(info)})
    }
  }
}

/**
 * 格式化日期
 * @param date
 * @returns {string}
 */
function formatDateTime(date = new Date()) {
  let month = date.getMonth() + 1; // 月份从0开始，所以要加1
  let day = date.getDate();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();

  // 格式化成两位数的字符串
  month = (month < 10 ? "0" : "") + month;
  day = (day < 10 ? "0" : "") + day;
  hours = (hours < 10 ? "0" : "") + hours;
  minutes = (minutes < 10 ? "0" : "") + minutes;
  seconds = (seconds < 10 ? "0" : "") + seconds;

  let formattedDate = month + "/" + day + " " + hours + ":" + minutes + ":" + seconds;
  return formattedDate;
}

function vLog(...args) {
  let _args = args?.length === 1 ? args[0] : args

  if (Array.isArray(_args)){
    const logArgs = formatLogArgs(_args);
    console.log(`[${formatDateTime()}]`, ...logArgs);
  }

  if (Object.prototype.toString.call(_args) === "[object Object]" && _args.hasOwnProperty('name')){
    return consoleEntity[`${_args?.name}`].subscription(_args)
  }

  return console.log(`%c [${formatDateTime()}]`, `font-size:${VLOG_CONFIG_FONT_SIZE.normal};color:${LOCAL_STATUS_COLOR.LOG}`, _args)
}

for (let i = 0, type; type = VLOG_FUNC[i++];) {
  (function(type) {
    vLog[type] = (...args) => {
      const {logMark, logContent} = formatLogContent(args)
      console.log(`%c ${logMark}`, `font-size:${VLOG_CONFIG_FONT_SIZE.normal};color:${LOCAL_STATUS_COLOR[type.toLocaleUpperCase()]}`, ...logContent)

      return {
        report: () => {
          if (!log)
            return
          switch (type) {
            case 'log':
            case 'info':
              log.info.apply(log, logContent)
              break
            case 'warn':
              log.warn.apply(log, logContent)
              break
            case 'error':
              log.error.apply(log, logContent)
              break
            case 'table':
              console.log(logContent)
              break

            default:
              break
          }
        }
      }
    }
  })(type)
}

vLog.setFilterMsg = (msg) => {
  if (!log || !log.setFilterMsg) return
  if (typeof msg !== 'string') return
  log.setFilterMsg(msg)
  console.log(`%c ${msg}`, `color:${LOCAL_STATUS_COLOR.TAG}`)
}

vLog.addFilterMsg = (msg) => {
  if (!log || !log.addFilterMsg) return
  if (typeof msg !== 'string') return
  log.addFilterMsg(msg)
  console.log(`%c ${msg}`, `color:${LOCAL_STATUS_COLOR.TAG}`)
}

export default vLog
