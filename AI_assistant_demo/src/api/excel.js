import axios from 'axios'

// 创建 axios 实例
const apiClient = axios.create({
  baseURL: 'http://10.110.15.79:8080/app', // 接口基础地址
  timeout: 5000 // 请求超时时间
})

// 查询数据的函数
export function fetchExcelData(query, downloadFlag = 0) {
  return apiClient.get('/test', {
    params: { query, downloadFlag },
    responseType: downloadFlag === 1 ? 'blob' : 'json' // blob 用于文件下载
  })
}

// 下载 Excel 的辅助函数
export function downloadFile(blobData, filename) {
  const url = window.URL.createObjectURL(new Blob([blobData]))
  const link = document.createElement('a')
  link.href = url
  link.setAttribute('download', filename)
  document.body.appendChild(link)
  link.click()
  link.remove()
}
