const wxReport = wx?.getRealtimeLogManager ? wx.getRealtimeLogManager() : f => f

const baseDataType = ['string', 'number', 'boolean', 'undefined', 'symbol', 'bigint']
const specialDataType = ['Undefined', 'Null', 'NaN', 'Infinity', '-Infinity']
/**
 * console 颜色配置
 * @type {{warn: string, log: string, report: string, error: string, info: string}}
 */
const colorConfig = {
  report: '#00a803',
  log: '#5b5de5ff',
  info: '#810081',
  warn: '#bda101',
  error: '#ff4b28ff',
}

/**
 * console 样式配置
 * @type {{warn: string[], log: string[], report: string[], error: string[], info: string[]}}
 */
const styleConfig = {
  report: [],
  log: [],
  info: [],
  warn: [],
  error: [],
}

/**
 * 添加 console 颜色
 * @param args
 * @param type
 * @return {*[]}
 */
const addArgsColor = (args = [], type = '') => {
  if (!args?.length) return args

  if (typeof args[0] === 'string' && !args[0].startsWith('%c')){
    styleConfig[type] = [`%c ${args[0]} `, `background:${colorConfig[type]};color:#fff`]
    args = args.slice(1)
    args = [...styleConfig[type], ...args]
  }

  return args
}

/**
 * 判断是否属于复杂对象
 * @param obj
 * @return {boolean}
 */
const isComplexObject = (obj) => {
  let isComplex = false
  if ((typeof obj === 'object' || typeof obj === 'function') && obj !== null){

    if (obj instanceof Object){
      let allKeys = Reflect.ownKeys(obj)
      let __count = 0
      for (let key of allKeys) {
        if (key.startsWith('__')){
          __count++
        }
        if (__count > 2){
          isComplex = true
          break
        }
      }
    } else if (Array.isArray(obj)){
      if (obj.length >= 30){
        isComplex = true
      }
    } else if (obj instanceof Map || obj instanceof Set){
      if (obj.size >= 30){
        isComplex = true
      }
    } else if (obj instanceof WeakMap || obj instanceof WeakSet){
      isComplex = true
    } else if (obj instanceof Function){
      isComplex = true
    } else if (obj instanceof Promise){
      isComplex = true
    } else if (obj instanceof Error){
      isComplex = true
    }
  }

  return isComplex
}

/**
 * 获取特殊数据类型
 * @param obj
 * @return {string}
 */
const getStringifySpecialDataType = (obj) => {
  let originType = Object.prototype.toString.call(obj).slice(8, -1)
  if (specialDataType.includes(originType)){
    return originType
  }
  return ''
}

/**
 * 组装上报参数
 * @param args
 * @return {{reportArgs: *[], tag: (*|string)}}
 */
const formatReportArgs = (args = []) => {
  let reportTag = ''
  let reportArgs = []
  if (!args?.length){
    return {
      tag: 'TAG', reportArgs: args
    }
  }

  reportTag = args && args[0]
  args = args.slice(1)
  for (let arg of args) {
    if (baseDataType.includes(typeof arg) || !isComplexObject(arg)){
      reportArgs.push(arg)
    } else if (getStringifySpecialDataType(arg)){
      reportArgs.push(getStringifySpecialDataType(arg))
    }
  }

  return {tag: reportTag, reportArgs: reportArgs}
}

/**
 * 重写 console
 * @type {WechatMiniprogram.Console | Console}
 * @returns {{report: (function(): void)}}
 * @report
 */
const vLog = new Proxy(console, {
  get(target, p, receiver) {
    return function(...args) {
      switch (p) {
        case 'log':
        case 'info':
          Reflect.get(target, p, receiver).apply(target, addArgsColor(args, `${p}`))
          return {
            report: function() {
              const {tag = '', reportArgs = []} = formatReportArgs(args)
              if (reportArgs && reportArgs?.length){
                for (let reportInfo of reportArgs) {
                  wxReport?.info({reportTag: tag, reportInfo})
                }
              }
            }
          }

        case 'warn':
          Reflect.get(target, p, receiver).apply(target, addArgsColor(args, `${p}`))
          return {
            report: function() {
              const {tag = '', reportArgs = []} = formatReportArgs(args)
              if (reportArgs && reportArgs?.length){
                for (let reportInfo of reportArgs) {
                  wxReport?.warn({reportTag: tag, reportInfo})
                }
              }
            }
          }
        case 'error':
          Reflect.get(target, p, receiver).apply(target, addArgsColor(args, `${p}`))
          return {
            report: function() {
              const {tag = '', reportArgs = []} = formatReportArgs(args)
              if (reportArgs && reportArgs?.length){
                for (let reportInfo of reportArgs) {
                  wxReport?.error({reportTag: tag, reportInfo})
                }
              }
            }
          }

        default:
          return Reflect.get(target, p, receiver).apply(target, args)
      }
    }
  }
})

export default vLog
