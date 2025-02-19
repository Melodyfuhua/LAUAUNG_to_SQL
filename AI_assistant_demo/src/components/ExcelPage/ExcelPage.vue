<template>
  <div>
    <h2>Excel 数据操作</h2>
    <button @click="queryData">查询数据</button>
    <button @click="downloadExcel">下载 Excel</button>
    <ul v-if="results.length">
      <li v-for="(item, index) in results" :key="index">{{ item }}</li>
    </ul>
  </div>
</template>

<script>
import { downloadFile, fetchExcelData } from '@/excel'

export default {
  name: 'ExcelPage',
  data() {
    return {
      results: [] // 存储查询结果
    }
  },
  methods: {
    async queryData() {
      try {
        const query = 'SELECT * FROM fund_all limit 10' // 查询语句
        const response = await fetchExcelData(query) // 默认不下载
        this.results = response.data // 假设返回的是 JSON 格式数据
      } catch (error) {
        console.error('查询失败:', error)
      }
    },
    async downloadExcel() {
      try {
        const query = 'SELECT * FROM fund_all limit 10' // 查询语句
        const response = await fetchExcelData(query, 1) // 设置下载标志
        downloadFile(response.data, 'query_results.xlsx') // 调用文件下载函数
      } catch (error) {
        console.error('下载失败:', error)
      }
    }
  }
}
</script>
