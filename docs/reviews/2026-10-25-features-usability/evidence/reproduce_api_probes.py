"""Review probes against a disposable DB; never use repository .env or real accounts."""
import os, sys, json, re, tempfile
from pathlib import Path

repo = Path(sys.argv[1]).resolve() if len(sys.argv) > 1 else Path(__file__).resolve().parents[4]
runtime = Path(tempfile.mkdtemp(prefix='continuum-api-review-'))
os.chdir(runtime)
(runtime / 'frontend').symlink_to(repo / 'frontend', target_is_directory=True)
os.environ.update(DATABASE_URL=f'sqlite:///{runtime}/review.db', POSTMARK_API_KEY='', SMTP_ENABLED='false',
    AWS_ACCESS_KEY_ID='', AWS_SECRET_ACCESS_KEY='', TAVILY_API_KEY='', OUTBOX_DIR=str(runtime/'outbox'),
    UPLOAD_DIR=str(runtime/'uploads'), PULSE_SCHEDULER_ENABLED='false')
sys.path.insert(0, str(repo))
from fastapi.testclient import TestClient
from sqlmodel import SQLModel, Session
from backend.main import app
from backend.database import engine, User
from backend.auth import get_current_user

SQLModel.metadata.create_all(engine)
with Session(engine) as s:
    u = User(external_id='isolated-review', email='parent@example.test')
    s.add(u); s.commit(); s.refresh(u); uid=u.id
def review_user():
    with Session(engine) as s:
        return s.get(User, uid)
app.dependency_overrides[get_current_user] = review_user
# No lifespan context: scheduler and startup seeding do not run.
c = TestClient(app, raise_server_exceptions=False)
results=[]
def probe(name, method, path, payload=None):
    r=c.request(method,path,json=payload) if payload is not None else c.request(method,path)
    try: data=r.json()
    except Exception: data=r.text[:160]
    results.append({'probe':name,'method':method,'path':path,'status':r.status_code,'response':data})
    return data

probe('document UI endpoint', 'GET', '/api/data/vault_documents')
probe('ethical will UI endpoint', 'GET', '/api/data/ethical_will')
probe('life lessons UI endpoint', 'GET', '/api/data/life_lessons')
probe('estate profile raw singleton payload', 'POST','/api/estate/profile',{'owner_name':'Review Parent'})
probe('estate profile server envelope control', 'POST','/api/estate/profile',{'data':{'ownerName':'Review Parent'}})
probe('funeral singleton gets collection', 'GET','/api/data/funeral_data')
probe('funeral singleton posts object', 'POST','/api/data/funeral_data',{'wishes':json.dumps({'venue':'Review Hall'}),'budget':'[]'})
probe('funeral singleton reload', 'GET','/api/data/funeral_data')
asset=probe('property snake payload loses camel model fields', 'POST','/api/data/properties',{
    'name':'Review House','type':'Real Estate','valuation':100000,'ownership_details':'Sole owner',
    'purchase_date':'2020-01-01T00:00:00','documents':'Review deed','evidence':[{'url':'fake://photo'}]})
probe('digital category sees property', 'GET','/api/data/digital_assets')
probe('heirloom category sees property', 'GET','/api/data/heirlooms')
probe('digital screen payload lacks required asset name', 'POST','/api/data/digital_assets',{
    'platform':'Review Mail','username':'example','preference':'memorialize','instructions':'Ask son'})
fin=probe('financial UI payload camel fields converted to snake', 'POST','/api/data/financial_accounts',{
    'name':'Review Checking','type':'Financial','value':1234,'account_number':'1234','ownership_percentage':50,
    'login_url':'https://example.test','beneficiary_email':'son@example.test','value_history':'[100,1234]',
    'beneficiaries':'Review Son','notes':'Call review advisor'})
if isinstance(fin,dict) and fin.get('id'):
    probe('financial edit snake field is ignored', 'PUT',f"/api/data/financial_accounts/{fin['id']}",{'account_number':'9876','ownership_percentage':25})
probe('plain journal create', 'POST','/api/data/journal_entries',{'title':'Review memory','type':'reflection','content':'A synthetic memory for my son.'})
probe('journal edit carries created_at', 'PUT','/api/data/journal_entries/1',{'title':'Review edit','content':'Updated','created_at':'2026-01-01T00:00:00'})
probe('plain letter create', 'POST','/api/data/future_letters',{'title':'For my son','content':'Synthetic review letter.','type':'emotional','trigger_date':'2030-01-01','is_locked':True})
probe('time capsule mapper carries created_at', 'POST','/api/data/time_capsule',{'title':'For my son','recipient':'Review Son','content_preview':'Synthetic review capsule','trigger_type':'date','trigger_value':'2030-01-01','is_released':False,'created_at':'2026-01-01T00:00:00'})
probe('medical profile partial payload lacks user_id', 'POST','/api/medical/profile',{'blood_type':'O+','organ_donor':True,'allergies':'None'})
probe('medical profile persisted values after save', 'GET','/api/medical/profile')
probe('subscription UI payload', 'POST','/api/data/subscriptions',{'name':'Review Service','cost':10,'cycle':'monthly','payment_method':'Review card','cancellation_instructions':'Call support'})
probe('home access actual UI contract control', 'POST','/api/data/home_access',{'location':'Review safe','code_encrypted':'1234','instructions':'Upstairs'})
probe('vendor control', 'POST','/api/data/vendors',{'name':'Review Plumber','category':'Plumber','phone':'555-0100'})
probe('utility control', 'POST','/api/data/utilities',{'provider':'Review Water','service_type':'Water'})
probe('calendar UI camel fields converted to snake', 'POST','/api/data/calendar_events',{'title':'Review Anniversary','date':'2026-10-25','type':'anniversary','recurring':True})
probe('actual document API control', 'POST','/api/data/documents',{'title':'Review Will','category':'will','location_physical':'Review safe'})
probe('activity log actual payload after UUID ID stripped', 'POST','/api/data/activity_log',{'timestamp':'2026-01-01T00:00:00','module':'Financial','action':'CREATE','entity_type':'Asset','entity_id':'1','entity_name':'Review Checking','user_context':'Review Parent'})
probe('journal update with normalized writable fields control', 'PUT','/api/data/journal_entries/1',{'title':'Review edit','content':'Updated synthetic reflection'})
app.dependency_overrides.clear()
probe('media without bearer token (service reads wrong storage key)', 'GET','/api/media/')
output=repo/'docs/reviews/2026-10-25-features-usability/evidence/api-probes.json'
output.write_text(json.dumps({'isolation':'Disposable DB; fake user; dependency override; no lifespan, external email, or scheduler; SQLModel 0.0.31 compatibility environment','results':results},indent=2)+'\n')
for r in results:
    print(r['status'],r['probe'])
print('Saved',len(results),'probes to',output)
