# src/web/app.py
from flask import Flask, jsonify, render_template, send_file
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import csv
from io import StringIO

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///scanner.db'
db = SQLAlchemy(app)

class Scan(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
    total_findings = db.Column(db.Integer)
    critical_count = db.Column(db.Integer)
    high_count = db.Column(db.Integer)

class Finding(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    scan_id = db.Column(db.Integer, db.ForeignKey('scan.id'))
    resource_type = db.Column(db.String(50))
    resource_id = db.Column(db.String(100))
    risk = db.Column(db.String(20))
    detail = db.Column(db.Text)

@app.route('/')
def dashboard():
    return render_template('dashboard.html')

@app.route('/api/scans')
def api_scans():
    scans = Scan.query.order_by(Scan.timestamp.asc()).all()
    return jsonify([{
        'id': s.id,
        'timestamp': s.timestamp.isoformat(),
        'total_findings': s.total_findings,
        'critical_count': s.critical_count,
        'high_count': s.high_count
    } for s in scans])

@app.route('/api/findings')
def api_findings():
    scan_id = request.args.get('scan_id', type=int)
    risk = request.args.get('risk')
    query = Finding.query
    if scan_id:
        query = query.filter_by(scan_id=scan_id)
    if risk and risk != 'all':
        query = query.filter_by(risk=risk)
    findings = query.all()
    return jsonify([{
        'resource_type': f.resource_type,
        'resource_id': f.resource_id,
        'risk': f.risk,
        'detail': f.detail
    } for f in findings])

@app.route('/api/export/<int:scan_id>/csv')
def export_csv(scan_id):
    findings = Finding.query.filter_by(scan_id=scan_id).all()
    si = StringIO()
    cw = csv.writer(si)
    cw.writerow(['resource_type', 'resource_id', 'risk', 'detail'])
    for f in findings:
        cw.writerow([f.resource_type, f.resource_id, f.risk, f.detail])
    output = si.getvalue()
    return Response(output, mimetype='text/csv', headers={'Content-Disposition': 'attachment;filename=scan_report.csv'})

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)