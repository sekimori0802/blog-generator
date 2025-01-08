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
                blogContentElement.innerHTML = formatBlogContent(data.content);
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
