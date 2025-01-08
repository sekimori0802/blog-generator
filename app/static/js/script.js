document.addEventListener('DOMContentLoaded', () => {
    const blogForm = document.getElementById('blogForm');
    const topicInput = document.getElementById('topic');
    const loadingElement = document.getElementById('loading');
    const blogContentElement = document.getElementById('blogContent');

    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // 入力値の取得とバリデーション
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('トピックを入力してください');
            return;
        }

        try {
            // ローディング表示
            loadingElement.classList.remove('hidden');
            blogContentElement.textContent = '';

            // APIリクエスト
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                // 生成された記事を表示
                // マークダウンテキストをHTMLに変換
                let formattedContent = data.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 太字
                    .replace(/\*(.*?)\*/g, '<em>$1</em>') // イタリック
                    .replace(/# (.*?)\n/g, '<h1>$1</h1>\n') // h1
                    .replace(/## (.*?)\n/g, '<h2>$1</h2>\n') // h2
                    .replace(/- (.*?)(?:\n|$)/g, '<li>$1</li>') // リスト項目
                    .replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`); // リストのラッピング

                // 段落の処理
                formattedContent = formattedContent
                    .split('\n\n')
                    .map(paragraph => {
                        // すでにHTMLタグが含まれている場合はそのまま
                        if (paragraph.trim().startsWith('<')) {
                            return paragraph;
                        }
                        // 空の段落は無視
                        if (!paragraph.trim()) {
                            return '';
                        }
                        // 通常の段落をpタグで囲む
                        return `<p>${paragraph}</p>`;
                    })
                    .join('\n');

                blogContentElement.innerHTML = formattedContent;
            } else {
                throw new Error(data.message || 'エラーが発生しました');
            }
        } catch (error) {
            console.error('Error:', error);
            blogContentElement.innerHTML = `
                <div style="color: var(--error-color);">
                    エラーが発生しました: ${error.message}
                </div>
            `;
        } finally {
            // ローディング非表示
            loadingElement.classList.add('hidden');
        }
    });

    // ブログコンテンツのフォーマット
    function formatBlogContent(content) {
        // 改行を保持しながらHTMLエスケープ
        const escapedContent = content
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');

        // 改行を<br>タグに変換
        return escapedContent.replace(/\n/g, '<br>');
    }
});
