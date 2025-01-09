document.addEventListener('DOMContentLoaded', () => {
    const blogForm = document.getElementById('blogForm');
    const topicInput = document.getElementById('topic');
    const loadingElement = document.getElementById('loading');
    const blogContentElement = document.getElementById('blogContent');
    const actionButtonsElement = document.getElementById('actionButtons');
    const saveButton = document.getElementById('saveButton');
    const exportButton = document.getElementById('exportButton');
    const articlesListElement = document.getElementById('articlesList');

    let currentArticle = null;

    // 記事一覧を読み込む
    loadArticles();

    blogForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const topic = topicInput.value.trim();
        if (!topic) {
            alert('トピックを入力してください');
            return;
        }

        try {
            loadingElement.classList.remove('hidden');
            blogContentElement.textContent = '';
            actionButtonsElement.classList.add('hidden');

            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ topic }),
            });

            const data = await response.json();

            if (data.status === 'success') {
                currentArticle = {
                    title: `${topic}に関する記事`,
                    content: data.content
                };

                const formattedContent = formatContent(data.content);
                blogContentElement.innerHTML = formattedContent;
                actionButtonsElement.classList.remove('hidden');
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
            loadingElement.classList.add('hidden');
        }
    });

    // 記事を保存
    saveButton.addEventListener('click', async () => {
        if (!currentArticle) return;

        try {
            const response = await fetch('/api/articles', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentArticle),
            });

            const data = await response.json();
            if (data.status === 'success') {
                alert('記事が保存されました');
                loadArticles(); // 記事一覧を更新
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('記事の保存に失敗しました: ' + error.message);
        }
    });

    // 記事をエクスポート
    exportButton.addEventListener('click', async () => {
        if (!currentArticle) return;

        try {
            const response = await fetch('/api/export-text', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(currentArticle),
            });

            if (response.ok) {
                // レスポンスをBlobとして取得
                const blob = await response.blob();
                // BlobからオブジェクトURLを作成
                const url = window.URL.createObjectURL(blob);
                
                // 一時的なリンクを作成してクリック
                const a = document.createElement('a');
                a.href = url;
                a.download = response.headers.get('content-disposition')?.split('filename=')[1] || 'article.txt';
                document.body.appendChild(a);
                a.click();
                
                // クリーンアップ
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
            } else {
                const data = await response.json();
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('記事のエクスポートに失敗しました: ' + error.message);
        }
    });

    // 保存済み記事を読み込む
    async function loadArticles() {
        try {
            const response = await fetch('/api/articles');
            const data = await response.json();

            if (data.status === 'success') {
                articlesListElement.innerHTML = data.articles.map(article => `
                    <div class="article-card">
                        <h3 class="article-title">${article.title}</h3>
                        <div class="article-meta">
                            作成日: ${new Date(article.created_at).toLocaleString()}
                        </div>
                        <div class="article-actions">
                            <button class="article-btn view-btn" onclick="viewArticle(${article.id})">表示</button>
                            <button class="article-btn delete-btn" onclick="deleteArticle(${article.id})">削除</button>
                            <a href="/api/articles/${article.id}/export" class="article-btn export-btn">エクスポート</a>
                        </div>
                    </div>
                `).join('');
            }
        } catch (error) {
            console.error('Error:', error);
            articlesListElement.innerHTML = '<p>記事の読み込みに失敗しました</p>';
        }
    }

    // 記事を表示
    window.viewArticle = async (articleId) => {
        try {
            const response = await fetch(`/api/articles/${articleId}`);
            const data = await response.json();

            if (data.status === 'success') {
                currentArticle = data.article;
                blogContentElement.innerHTML = formatContent(data.article.content);
                actionButtonsElement.classList.remove('hidden');
                window.scrollTo(0, blogContentElement.offsetTop);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('記事の読み込みに失敗しました');
        }
    };

    // 記事を削除
    window.deleteArticle = async (articleId) => {
        if (!confirm('この記事を削除してもよろしいですか？')) return;

        try {
            const response = await fetch(`/api/articles/${articleId}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (data.status === 'success') {
                loadArticles(); // 記事一覧を更新
            } else {
                throw new Error(data.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('記事の削除に失敗しました');
        }
    };

    // マークダウンをHTMLに変換
    function formatContent(content) {
        let formattedContent = content
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/# (.*?)\n/g, '<h1>$1</h1>\n')
            .replace(/## (.*?)\n/g, '<h2>$1</h2>\n')
            .replace(/- (.*?)(?:\n|$)/g, '<li>$1</li>')
            .replace(/<li>.*?<\/li>/gs, match => `<ul>${match}</ul>`);

        return formattedContent
            .split('\n\n')
            .map(paragraph => {
                if (paragraph.trim().startsWith('<')) return paragraph;
                if (!paragraph.trim()) return '';
                return `<p>${paragraph}</p>`;
            })
            .join('\n');
    }
});
