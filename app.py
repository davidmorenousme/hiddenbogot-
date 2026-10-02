import os
import mysql.connector
from flask import Flask, render_template
from dotenv import load_dotenv
from flask import request, redirect, url_for, flash

load_dotenv()

app = Flask(__name__)
app.secret_key = os.getenv("SECRET_KEY", "cambiame")


import bcrypt
from flask_login import (
    LoginManager, UserMixin, login_user,
    login_required, logout_user, current_user
)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = "login_turista"


class Usuario(UserMixin):
    def __init__(self, id, nombre, email, rol):
        self.id = id
        self.nombre = nombre
        self.email = email
        self.rol = rol


@login_manager.user_loader
def load_user(user_id):
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT id, nombre, email, rol FROM usuarios WHERE id = %s", (user_id,))
    row = cur.fetchone()
    cur.close()
    conn.close()
    if row:
        return Usuario(row["id"], row["nombre"], row["email"], row["rol"])
    return None

def get_db():
    return mysql.connector.connect(
        host=os.getenv("DB_HOST", "localhost"),
        user=os.getenv("DB_USER", "root"),
        password=os.getenv("DB_PASSWORD", ""),
        database=os.getenv("DB_NAME", "hiddenbogota"),
    )


@app.route("/")
def index():
    destacado = None
    try:
        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT nombre, descripcion, direccion, categoria, horario "
            "FROM comercios WHERE estado = 'publicado' ORDER BY id LIMIT 1"
        )
        destacado = cur.fetchone()
        cur.close()
        conn.close()
    except mysql.connector.Error:
        pass
    return render_template("index.html", destacado=destacado)


@app.route("/db-test")
def db_test():
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute("SELECT nombre, categoria, direccion FROM comercios")
    filas = cur.fetchall()
    cur.close()
    conn.close()
    return {"comercios": filas}


@app.route("/login-turista")
@app.route("/login-turista", methods=["GET", "POST"])
def login_turista():
    if request.method == "POST":
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")

        conn = get_db()
        cur = conn.cursor(dictionary=True)
        cur.execute(
            "SELECT id, nombre, email, password_hash, rol FROM usuarios "
            "WHERE email = %s AND rol = 'turista'", (email,)
        )
        row = cur.fetchone()
        cur.close()
        conn.close()

        if row and bcrypt.checkpw(password.encode("utf-8"), row["password_hash"].encode("utf-8")):
            user = Usuario(row["id"], row["nombre"], row["email"], row["rol"])
            login_user(user)
            return redirect(url_for("dashboard_turista"))

        flash("Correo o contraseña incorrectos.")

    return render_template("login_turista.html")


@app.route("/registro-turista", methods=["GET", "POST"])
def registro_turista():
    if request.method == "POST":
        nombre = request.form.get("nombre", "").strip()
        email = request.form.get("email", "").strip().lower()
        password = request.form.get("password", "")
        pais = request.form.get("pais_origen", "").strip()

        if not nombre or not email or not password:
            flash("Completa todos los campos obligatorios.")
            return render_template("login_turista.html")

        hash_pw = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

        conn = get_db()
        cur = conn.cursor()
        try:
            cur.execute(
                "INSERT INTO usuarios (nombre, email, password_hash, rol, pais_origen) "
                "VALUES (%s, %s, %s, 'turista', %s)",
                (nombre, email, hash_pw, pais)
            )
            conn.commit()
        except mysql.connector.IntegrityError:
            flash("Ese correo ya está registrado. Inicia sesión.")
            cur.close()
            conn.close()
            return render_template("login_turista.html")

        cur.close()
        conn.close()
        flash("Cuenta creada. Ahora inicia sesión.")

    return render_template("login_turista.html")


@app.route("/dashboard-turista")
@login_required
def dashboard_turista():
    conn = get_db()
    cur = conn.cursor(dictionary=True)
    cur.execute(
        "SELECT nombre, descripcion, direccion, categoria, horario "
        "FROM comercios WHERE estado = 'publicado' ORDER BY id LIMIT 1"
    )
    recomendado = cur.fetchone()
    cur.close()
    conn.close()
    return render_template("dashboard_turista.html", recomendado=recomendado)


@app.route("/logout")
@login_required
def logout():
    logout_user()
    return redirect(url_for("index"))


@app.route("/login-comercio")
def login_comercio():
    return "Login de comercio (Paso 6)"


if __name__ == "__main__":
    app.run(debug=True)