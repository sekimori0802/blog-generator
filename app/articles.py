from flask import Blueprint, jsonify, request, send_file
from flask_login import login_required, current_user
from .models import Article, db
import os
from datetime import datetime
import io
from typing import Optional

articles = Blueprint('articles', __name__)

@articles.route('/api/articles', methods=['POST'])
@login_required
def create_article():
    try:
        data = request.get_json()
        title = data.get('title', f'ブログ記事 - {datetime.now().strftime("%Y-%m-%d %H:%M")}')
        content = data.get('content')
        
        article = Article(
            title=title,
            content=content,
            user_id=current_user.id
        )
        
        db.session.add(article)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '記事が保存されました',
            'article': article.to_dict()
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@articles.route('/api/articles', methods=['GET'])
@login_required
def get_articles():
    try:
        articles = Article.query.filter_by(user_id=current_user.id).order_by(Article.created_at.desc()).all()
        return jsonify({
            'status': 'success',
            'articles': [article.to_dict() for article in articles]
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def create_text_file(title: str, content: str, username: str, article_id: Optional[int] = None) -> tuple[io.BytesIO, str]:
    """テキストファイルの内容を作成し、Bufferとファイル名を返す"""
    # テキストファイルの内容を作成
    text_content = f"""タイトル: {title}
作成日時: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
作成者: {username}

{content}
"""
    
    # メモリ上にファイルを作成
    buffer = io.BytesIO()
    buffer.write(text_content.encode('utf-8'))
    buffer.seek(0)
    
    # ファイル名を設定
    id_part = f"_{article_id}" if article_id else ""
    filename = f"article{id_part}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
    
    return buffer, filename

@articles.route('/api/articles/<int:article_id>/export', methods=['GET'])
@login_required
def export_article(article_id):
    try:
        article = Article.query.get_or_404(article_id)
        
        # ユーザーが記事の所有者であることを確認
        if article.user_id != current_user.id:
            return jsonify({
                'status': 'error',
                'message': '権限がありません'
            }), 403
        
        buffer, filename = create_text_file(
            article.title,
            article.content,
            article.author.username,
            article.id
        )
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='text/plain'
        )
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@articles.route('/api/export-text', methods=['POST'])
@login_required
def export_text():
    try:
        data = request.get_json()
        title = data.get('title', f'ブログ記事 - {datetime.now().strftime("%Y-%m-%d %H:%M")}')
        content = data.get('content')
        
        if not content:
            return jsonify({
                'status': 'error',
                'message': 'コンテンツが必要です'
            }), 400
        
        buffer, filename = create_text_file(
            title,
            content,
            current_user.username
        )
        
        return send_file(
            buffer,
            as_attachment=True,
            download_name=filename,
            mimetype='text/plain'
        )
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

@articles.route('/api/articles/<int:article_id>', methods=['DELETE'])
@login_required
def delete_article(article_id):
    try:
        article = Article.query.get_or_404(article_id)
        
        # ユーザーが記事の所有者であることを確認
        if article.user_id != current_user.id:
            return jsonify({
                'status': 'error',
                'message': '権限がありません'
            }), 403
        
        db.session.delete(article)
        db.session.commit()
        
        return jsonify({
            'status': 'success',
            'message': '記事が削除されました'
        })
    except Exception as e:
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500
