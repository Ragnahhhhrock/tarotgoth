import json, sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:8766"
IMG = "/home/claude/tarotgoth/public/assets/stripe-checkout.png"
OK = {"status":"ok","needs_care":False,"spread":{"name":"Three-card spread","card_count":3,"note":""},
 "cards":[{"name":"Five of Cups","short":"5","position":"Past","orientation":"upright","uncertain":False},
          {"name":"The Moon","short":"XVIII","position":"Present","orientation":"upright","uncertain":True},
          {"name":"The Tower","short":"XVI","position":"Future","orientation":"reversed","uncertain":False}],
 "verdict":"Three cards, zero good news. You came to the right place.",
 "sections":[{"card":"Five of Cups","position":"Past","text":"Three cups spilled, two still standing, and you are staring at the spilled ones."},
             {"card":"The Moon","position":"Present","text":"Nothing is what it looks like, least of all your own motives."},
             {"card":"The Tower, reversed","position":"Future","text":"The collapse is coming and you are working hard to postpone it."}],
 "close":"Wear black. You already do."}

def run(pw, reply, name, shot=None):
    b = pw.chromium.launch(); ctx = b.new_context(viewport={"width":390,"height":844}); pg = ctx.new_page()
    errs=[]; pg.on("console", lambda m: errs.append(m.text) if m.type=="error" else None)
    pg.on("pageerror", lambda e: errs.append(str(e)))
    sent={}
    def handle(route):
        sent["body"]=json.loads(route.request.post_data)
        status, body = reply
        route.fulfill(status=status, content_type="application/json", body=json.dumps(body))
    pg.route("**/api/read", handle)
    pg.goto(BASE+"/"); pg.wait_for_timeout(300)
    if shot: pg.screenshot(path=f"/home/claude/tools/shots/{shot}-home.png", full_page=True)
    pg.set_input_files("#in-roll", IMG); pg.wait_for_selector("#screen-preview:not([hidden])")
    if shot: pg.screenshot(path=f"/home/claude/tools/shots/{shot}-preview.png", full_page=True)
    pg.fill("#question","Should I text them?")
    pg.click("#btn-read"); pg.wait_for_timeout(700)
    return b, pg, sent, errs

with sync_playwright() as pw:
    # happy path
    b,pg,sent,errs = run(pw,(200,OK),"ok","ok")
    pg.wait_for_selector("#screen-result:not([hidden])")
    assert sent["body"]["mediaType"]=="image/jpeg" and len(sent["body"]["image"])>1000 and sent["body"]["question"]=="Should I text them?"
    assert pg.inner_text("#res-spread")=="Three-card spread"
    assert pg.locator("#res-cards li").count()==3
    assert "not sure" in pg.inner_text("#res-cards")
    assert pg.get_attribute("#res-coffee a","href").startswith("https://buy.stripe.com/")
    assert pg.evaluate("document.documentElement.scrollWidth")==390
    pg.screenshot(path="/home/claude/tools/shots/ok-result.png", full_page=True)
    pg.click("#btn-again"); assert pg.is_visible("#screen-home")
    assert not errs, errs; b.close()
    # no cards
    b,pg,_,errs = run(pw,(200,{"status":"no_cards","needs_care":False,"verdict":"A cat on a sofa."}),"nc")
    pg.wait_for_selector("#screen-error:not([hidden])"); assert "No cards" in pg.inner_text("#error-title")
    pg.screenshot(path="/home/claude/tools/shots/err.png"); b.close()
    # rate limit
    b,pg,_,_ = run(pw,(429,{"error":"rate_limited"}),"rl")
    pg.wait_for_selector("#screen-error:not([hidden])"); assert "enough readings" in pg.inner_text("#error-title"); b.close()
    # care
    b,pg,_,_ = run(pw,(200,{"status":"ok","needs_care":True,"verdict":"I'm putting the cards down. I'm glad you said it."}),"care")
    pg.wait_for_selector("#screen-result:not([hidden])")
    assert pg.is_visible("#res-care") and not pg.is_visible("#res-coffee") and not pg.is_visible("#res-body")
    pg.screenshot(path="/home/claude/tools/shots/care.png"); b.close()
    # offline
    b,pg,_,_ = run(pw,(200,OK),"x")
    b.close()
print("ui tests passed")
