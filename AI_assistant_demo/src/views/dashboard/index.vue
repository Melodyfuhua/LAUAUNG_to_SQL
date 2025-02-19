<template>
  <div class="container">
    <!-- 输入部分 -->
    <div class="row inputs-row">
      <!-- 手动输入 -->
      <div class="input-section">
        <label>请以 "查询" 开始输入：</label>
        <textarea v-model="manualInputText" placeholder="请输入生成SQL的文本"></textarea>
        <button
          :class="{ 'recording': isRecording, 'idle': !isRecording }"
          @click="toggleRecording"
        >
          {{ isRecording ? '结束录音' : '开始录音' }}
        </button>
        <button class="idle1" @click="submitManualQuery">提交</button>
      </div>
    </div>

    <!-- 输出部分 -->
    <div class="output-section">
      <!-- 显示生成的SQL语句 -->
      <div class="generated-sql">
        <label>生成的SQL语句：</label>
        <pre>{{ generatedSql }}</pre>
      </div>

      <!-- 查询结果展示 -->
      <h2>展示查询结果：</h2>
      <div class="buttons-row">
        <button class="idle" @click="downloadResult">下载结果（Excel）</button>
        <button class="idle center-button" @click="downloadResult1">查询结果展示</button>
      </div>

      <!-- 查询结果表格 -->
      <div v-if="items.length > 0">
        <table border="1">
          <thead>
            <tr>
              <th v-for="key in columns" :key="key">{{ key }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in items" :key="index">
              <td v-for="key in columns" :key="key">{{ item[key] }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <!-- 查询结果为空时显示 -->
      <div v-else class="no-data" v-if="isQueryExecuted">查询不到这样的数据呢，建议您更改一下输入内容再尝试一次</div>
    </div>
  </div>
</template>
<script>
import axios from 'axios';
export default {
  data() {
    return {
      manualInputText: '',
      voiceInputText: '',
      isRecording: false,
      generatedSql: '', // 保存生成的SQL语句
      recognition: null,   // SpeechRecognition 对象
      queryResults: [], // 查询结果
      tableHeaders: [], // 动态表头
      items: [], // 用于存储从接口获取的数据
      columns: [], // 用于存储表头字段
      isQueryExecuted: false,  // 在 data 中定义 isQueryExecuted
      originalText: '',
      currentRecognition:''
    };
  },
  created() {
  },
  methods: {
    setColumns() {
      if (this.items.length > 0) {
        this.columns = Object.keys(this.items[0]); // 假设所有项的结构相同
      }
    },
    submitManualQuery() {
      this.generateQuery(this.manualInputText);
    },
    toggleRecording() {
      this.isRecording = !this.isRecording;
      
      if (this.isRecording) {
        // 保存当前文本
        this.originalText = this.manualInputText;
        // 重置当前录音识别的文本
        this.currentRecognition = '';
        
        if ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) {
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          
          this.recognition = new SpeechRecognition();
          this.recognition.lang = 'zh-CN';
          this.recognition.interimResults = true;
          this.recognition.maxAlternatives = 1;
          this.recognition.continuous = true;
          
          this.recognition.start();
          console.log('语音识别已开始');
          
          this.recognition.onresult = (event) => {
            // 清空临时结果
            this.currentRecognition = '';
            
            // 累加所有最终结果
            for (let i = 0; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                this.currentRecognition += event.results[i][0].transcript;
              }
            }
            
            // 更新文本框内容：原文 + 当前识别的文本
            this.manualInputText = this.originalText + 
              (this.originalText && this.currentRecognition ? ' ' : '') + // 如果原文存在且有新识别文本，添加空格
              this.currentRecognition;
              
            console.log('当前识别结果：', this.currentRecognition);
          };
          
          this.recognition.onend = () => {
            console.log('语音识别已结束');
            if (this.isRecording) {
              this.recognition.start();
            }
          };
          
          this.recognition.onerror = (event) => {
            console.error('语音识别错误:', event.error);
            this.isRecording = false;
          };
          
        } else {
          alert('浏览器不支持语音识别');
          this.isRecording = false;
        }
      } else {
        // 停止录音时，确保当前识别的文本被保留
        if (this.recognition) {
          this.recognition.stop();
          this.recognition = null;
          // 更新原始文本，包含这次录音的结果
          this.originalText = this.manualInputText;
        }
      }
    },


    async generateQuery(inputText) {
      try {
        // 调用后端接口生成SQL语句
        const response = await axios.get('http://10.110.15.79:8080/app/model', {
          params: { param: inputText },
        });

        console.log('后端返回的数据:', response.data); // 打印完整的响应数据

        this.generatedSql = response.data; 
        console.log('生成的SQL语句:', this.generatedSql); // 打印生成的 SQL
      } catch (error) {
        console.error('生成SQL请求失败:', error);
      }
    },
    async downloadResult() {
      try {
        const response = await axios.get('http://10.110.15.79:8080/app/test', {
          params: {
            query: this.generatedSql, // 使用生成的 SQL 语句
            downloadFlag: 1, // 设置下载标志
          },
          responseType: 'blob', // 设置响应类型为 'blob'，以处理文件
        });

        const contentDisposition = response.headers['content-disposition'];
        const fileName = contentDisposition
          ? contentDisposition.split('filename=')[1]
          : 'default_filename.xlsx';

        const blob = new Blob([response.data], { type: 'application/vnd.ms-excel' });
        const link = document.createElement('a');
        const url = window.URL.createObjectURL(blob);
        link.href = url;
        link.download = fileName;
        link.click();

        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('下载失败:', error);
      }
    },
    async downloadResult1() {
      try {
        const response = await axios.get('http://10.110.15.79:8080/app/test', {
        params: {
                query: this.generatedSql, // 使用生成的 SQL 语句
                downloadFlag: 0, // 设置下载标志
          },
        });
        this.items = response.data; // 假设接口返回的是一个JSON数组
        this.setColumns();
        if (response.data && response.data.length == 0) {
          this.isQueryExecuted = true; // 无论数据是否返回，都表示查询已执行
        }
        else{
          this.isQueryExecuted = false;
        }
      } catch (error) {
        console.error('获取数据失败:', error);
        this.items = []; // 清空数据，显示“没有数据”
        this.isQueryExecuted = true; // 无论数据是否返回，都表示查询已执行
      }
    },
  },
  beforeDestroy() {
    if (this.recognition) {
      this.recognition.stop();
      this.recognition = null;
    }
  }
};
</script>
<style scoped>
.container {
  padding: 20px;
}
.row.inputs-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
}
.input-section {
  flex: 1 1 48%;
  margin: 10px;
  box-sizing: border-box;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 5px;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
}
textarea {
  width: 100%;
  height: 80px;
  margin-bottom: 10px;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
}
button {
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  width: 20%;
}
button:hover {
  opacity: 0.9;
}
button.recording {
  background-color: red;
}
button.idle {
  background-color: #4CAF50;
}
.output-section {
  margin-top: 30px;
}
.generated-sql {
  margin: 20px 0;
  padding: 10px;
  background-color: #f4f4f4;
  border: 1px solid #ddd;
  border-radius: 5px;
  max-width: 100%;
  overflow-x: auto; /* 显示横向滚动条 */
}
pre {
  margin: 0;
  font-family: 'Source Code Pro', monospace; /* 更换为 Source Code Pro 字体 */
  background: none;
  white-space: pre-wrap; /* 允许换行 */
  word-wrap: break-word; /* 超过容器宽度时换行 */
  max-width: 100%; /* 限制最大宽度 */
  overflow-x: auto; /* 横向出现滚动条 */
}
table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}
th,
td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: left;
}
th {
  background-color: #f2f2f2;
}
.buttons-row {
  display: flex;
  justify-content: flex-start; /* 让所有按钮默认从左开始排列 */
  align-items: center;
  margin-top: 10px;
}

.center-button {
  margin-left: auto;  /* 将查询结果展示按钮推到右侧 */
  margin-right: auto; /* 同时将其推回到容器的中心 */
}
.no-data {
  display: flex;
  justify-content: center;  /* 水平居中 */
  align-items: center;      /* 垂直居中 */
  height: 200px;            /* 设置一个高度，确保居中效果明显 */
  font-size: 18px;          /* 可以根据需要调整字体大小 */
  color: #888;              /* 设置灰色文字 */
  text-align: center;       /* 确保文本居中 */
}
/* 为提交按钮定义一个新的 idle1 样式 */
button.idle1 {
  padding: 10px 20px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  background-color: #4CAF50;
  width: auto; /* 根据内容自适应宽度 */
  margin-left: 10px; /* 让按钮与“开始录音”按钮有间距 */
  display: inline-block; /* 使按钮与其他元素在同一行显示 */
}


button.idle1:hover {
  opacity: 0.8; /* 按钮悬停时稍微透明 */
}

</style>
