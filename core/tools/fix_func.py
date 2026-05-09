    data = request.json
    token = data.get('token')
    chat_id = data.get('chat_id')
    if token:
        # Single quotes for Python string, double quotes for sed
        cmd = 'sudo sed -i "s/TOKEN = \".*\"/TOKEN = \"' + str(token) + '\"/" /home/user/Tactical-Bot-Core/bot.py'
        subprocess.run(cmd, shell=True)
    if chat_id:
        cmd = 'sudo sed -i "s/ALLOWED_ID = .*/ALLOWED_ID = ' + str(chat_id) + '/" /home/user/Tactical-Bot-Core/bot.py'
        subprocess.run(cmd, shell=True)
    return jsonify({'ok': True})
