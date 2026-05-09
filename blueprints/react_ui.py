""" Integration des React-Frontends (Vite Proxy/Dist) """
import os
from flask import Blueprint, send_from_directory
from core.utils import login_required

react_ui_bp = Blueprint('react_ui', __name__)

_DIST = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'frontend', 'dist')


@react_ui_bp.route('/ui/')
@react_ui_bp.route('/ui')
@login_required
def react_index():
    return send_from_directory(_DIST, 'index.html')


@react_ui_bp.route('/ui/assets/<path:filename>')
def react_assets(filename):
    return send_from_directory(os.path.join(_DIST, 'assets'), filename)


@react_ui_bp.route('/ui/<filename>.svg')
def react_svg(filename):
    return send_from_directory(_DIST, filename + '.svg')


@react_ui_bp.route('/ui/<filename>.png')
def react_png(filename):
    return send_from_directory(_DIST, filename + '.png')



@react_ui_bp.route('/ui/<filename>.jpg')
def react_jpg(filename):
    return send_from_directory(_DIST, filename + '.jpg')

@react_ui_bp.route('/ui/manifest.webmanifest')
def react_manifest():
    return send_from_directory(_DIST, 'manifest.webmanifest')


@react_ui_bp.route('/ui/registerSW.js')
def react_sw_reg():
    return send_from_directory(_DIST, 'registerSW.js')


@react_ui_bp.route('/ui/sw.js')
def react_sw():
    return send_from_directory(_DIST, 'sw.js')


@react_ui_bp.route('/ui/<path:path>')
def react_catch_all(path):
    # For SPA routing, any path that doesn't exist as a file should serve index.html
    # BUT we should only serve index.html with login_required if it's a page route
    file_path = os.path.join(_DIST, path)
    if os.path.exists(file_path):
        return send_from_directory(_DIST, path)
    
    # If it's a page route (doesn't have an extension), we need login
    if '.' not in path:
        return react_index()
        
    # If it's a file request that doesn't exist, return 404
    return "Not Found", 404
