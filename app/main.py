from flask import Flask, render_template, request, jsonify
import google.generativeai as genai
import os
from dotenv import load_dotenv

# 環境変数の読み込み
load_dotenv()

# Google Gemini APIの設定
GOOGLE_API_KEY = os.getenv('GOOGLE_API_KEY')
genai.configure(api_key=GOOGLE_API_KEY)

app = Flask(__name__)
model = genai.GenerativeModel('gemini-pro')

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/generate', methods=['POST'])
def generate_blog():
    try:
        data = request.get_json()
        topic = data.get('topic', '')
        prompt = f"""
        以下のトピックについて、マークダウン形式でブログ記事を生成してください：
        トピック: {topic}
        
        以下の形式で記事を作成してください：

        # **[タイトル]**

        ## **導入**
        [導入部分のテキスト]

        ## **[セクション1]**
        [セクション1の内容]

        ## **[セクション2]**
        [セクション2の内容]

        ## **まとめ**
        [まとめの内容]

        記事は読みやすく、情報価値の高い内容にしてください。
        各セクションは**太字**や*イタリック*を適切に使用してください。
        """
        
        response = model.generate_content(prompt)
        return jsonify({
            'status': 'success',
            'content': response.text
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

if __name__ == '__main__':
    app.run(debug=True)
