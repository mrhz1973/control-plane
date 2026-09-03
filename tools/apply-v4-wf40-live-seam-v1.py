#!/usr/bin/env python3
"""Apply WF40 post-WF61 live authorization/dispatch seam correction offline."""
from __future__ import annotations

import copy
import json
import sys
from pathlib import Path

WF_ID = "9ZMj2ACTKyDVhCue"
EXPECTED_VERSION = "b040014d-100a-4604-82c7-d9236bd60a6b"
EXPECTED_NODES = 71
SNIPPET_DIR = Path(__file__).resolve().parent / "wf40-n8n-live-seam"

PREPARE_ADAPTER_ID = "v4f40-7401-4001-8401-000000000401"
PREPARE_TRANSPORT_ID = "v4f40-7501-4001-8501-000000000501"

NEW_IDS = [
    "v4f40-7601-4001-8601-000000000601",
    "v4f40-7602-4002-8602-000000000602",
    "v4f40-7603-4003-8603-000000000603",
    "v4f40-7604-4004-8604-000000000604",
    "v4f40-7605-4005-8605-000000000605",
    "v4f40-7606-4006-8606-000000000606",
    "v4f40-7607-4007-8607-000000000607",
    "v4f40-7608-4008-8608-000000000608",
    "v4f40-7609-4009-8609-000000000609",
    "v4f40-7610-4010-8610-000000000610",
    "v4f40-7611-4011-8611-000000000611",
    "v4f40-7612-4012-8612-000000000612",
]

PREPARE_PROPOSAL_JS = r"""const crypto=require('crypto');
const routing=$input.item.json??{};
const bridge=routing.bridge_result??null;
const cycle=$('Execute Workflow - WF61 primary remote planner').item.json??{};
const side=$('Code - Capture explicit V4 execution routing sidecar').item.json??{};
const packet=(cycle.packet&&typeof cycle.packet==='object'&&!Array.isArray(cycle.packet))?cycle.packet:null;
const route=(bridge&&bridge.execution_route_result&&typeof bridge.execution_route_result==='object')?bridge.execution_route_result:null;
const er=(route&&route.execution_route&&typeof route.execution_route==='object')?route.execution_route:null;
const rs=(side.v4_resource_status&&typeof side.v4_resource_status==='object')?side.v4_resource_status:(side.resource_status&&typeof side.resource_status==='object'?side.resource_status:null);
const resources=(rs&&rs.resources&&typeof rs.resources==='object')?rs.resources:{};
const task=String((cycle.task_id||packet?.task_id||bridge?.task_id||'')).trim();
const packetId=String((packet?.packet_id||'')).trim();
const reasons=[];
if(!(routing.routing_ready_for_dispatch===true&&bridge&&bridge.classification==='ROUTING_READY_FOR_DISPATCH'&&route&&packet)) reasons.push('ROUTING_NOT_READY');
if(!packet||packet.schema!=='execution-packet-v1'||!packetId||!Array.isArray(packet.steps)||packet.steps.length<1) reasons.push('PACKET_INVALID');
if(!(route&&route.status==='ROUTED'&&er&&er.route_id==='opencode+qwen_local'&&er.implementer==='opencode'&&er.model==='qwen_local')) reasons.push('ROUTE_NOT_OPENCODE_QWEN_LOCAL');
if(!(resources.opencode&&resources.opencode.available===true)) reasons.push('OPENCODE_UNAVAILABLE');
if(!(resources.qwen_local&&resources.qwen_local.available===true)) reasons.push('QWEN_LOCAL_UNAVAILABLE');
if(!task||!packetId) reasons.push('TASK_OR_PACKET_MISSING');
const executionId='wf40:'+task+':'+packetId;
const digest=crypto.createHash('sha256').update(executionId,'utf8').digest('hex');
const pendingId='PEND-WF40-'+digest;
const authId='AUTH-WF40-'+digest;
const scope={"scope_version":"qwen-execution-scope-v2","execution_harness":"opencode","model":"qwen_local","profile_id":"qwen38-dcfr-iq3-agent-24k","role":"FAST_AGENT","canonical_endpoint":"http://127.0.0.1:8080","single_generation_guard_required":true,"max_opencode_executions":1,"max_qwen_generation_calls":1,"retry":0,"fallback":0};
const scopeDigest=crypto.createHash('sha256').update(JSON.stringify(scope),'utf8').digest('hex');
if(scopeDigest!=='5261290cbdda414de0a6bd5ffd79e939f805eefde3fe2e39a8f490c5a2e02261') reasons.push('SCOPE_DIGEST_MISMATCH');
if(executionId.length>200||pendingId.length>200||authId.length>200) reasons.push('ID_TOO_LONG');
const ready=reasons.length===0;
const register_request=ready?{"schema_version":"v4-runtime-authorization-register-pending-request-v1","pending_decision_id":pendingId,"authorization_id":authId,"task_id":task,"execution_id":executionId,"route_id":"opencode+qwen_local","scope_digest":scopeDigest,"pending_ttl_seconds":900}:null;
const status_request=ready?{"schema_version":"v4-runtime-authorization-status-request-v1","pending_decision_id":pendingId}:null;
const dispatch_result=ready?{"schema_version":"opencode-execution-dispatch-result-v1","dispatch_id":"disp:"+executionId,"status":"READY","route_id":"opencode+qwen_local","implementer":"opencode","model":"qwen_local","qwen_session_status":"READY_ASSERTED_BY_RESOURCE_STATUS","opencode_available":true,"dispatch_ready":true,"execution_performed":false,"classification":"DISPATCH_READY","reason_codes":["DISPATCH_READY","RESOURCE_STATUS_AVAILABLE"],"dispatch_spec":{"schema_version":"opencode-dispatch-spec-v1","route_id":"opencode+qwen_local","implementer":"opencode","model":"qwen_local","source":"wf40-post-wf61-sidecar"}}:null;
return {json:{schema:'wf40-live-execution-proposal-v1',proposal_ready:ready,classification:ready?'LIVE_PROPOSAL_READY':'LIVE_PROPOSAL_NOT_READY',reason_codes:reasons,task_id:task||null,packet_id:packetId||null,execution_id:ready?executionId:null,pending_decision_id:ready?pendingId:null,authorization_id:ready?authId:null,register_request,status_request,dispatch_result,poll_count:0,execution_performed:false}};"""

def _read_snippet(name: str) -> str:
    return (SNIPPET_DIR / name).read_text(encoding="utf-8").strip()


PARSE_REGISTER_JS = _read_snippet("parse-authorization-register.js")
PARSE_STATUS_JS = _read_snippet("parse-authorization-status.js")

BUILD_SIDECARS_JS = r"""const st=$input.item.json??{};
const prop=$('Code - Prepare WF40 live execution proposal').item.json??{};
const scope={"scope_version":"qwen-execution-scope-v2","execution_harness":"opencode","model":"qwen_local","profile_id":"qwen38-dcfr-iq3-agent-24k","role":"FAST_AGENT","canonical_endpoint":"http://127.0.0.1:8080","single_generation_guard_required":true,"max_opencode_executions":1,"max_qwen_generation_calls":1,"retry":0,"fallback":0};
const expires=Date.parse(st.authorization_expires_at);
const future=Number.isFinite(expires)&&expires>Date.now();
const dispatch=(st.dispatch_result&&typeof st.dispatch_result==='object')?st.dispatch_result:(prop.dispatch_result||null);
const dispatchOk=Boolean(dispatch&&dispatch.classification==='DISPATCH_READY'&&dispatch.dispatch_ready===true&&dispatch.execution_performed===false&&dispatch.route_id==='opencode+qwen_local');
const ready=Boolean(st.issued===true&&future&&dispatchOk&&st.authorization_id&&st.pending_decision_id);
const runtime_authorization=ready?{"schema_version":"operator-runtime-authorization-v1","authorization_id":st.authorization_id,"authorization_state":"ACTIVE","route_id":"opencode+qwen_local","scope":scope}:null;
return {json:{schema:'wf40-live-issued-sidecars-v1',sidecars_ready:ready,classification:ready?'ISSUED_SIDECARS_READY':'ISSUED_SIDECARS_NOT_READY',reason_codes:ready?['ISSUED_SIDECARS_READY']:['ISSUED_SIDECARS_NOT_READY'],pending_decision_id:st.pending_decision_id||null,authorization_id:st.authorization_id||null,execution_id:st.execution_id||prop.execution_id||null,dispatch_result:ready?dispatch:null,runtime_authorization,execution_performed:false}};"""

GATE_CLOSED_JS = r"""return {json:{schema:'wf40-live-authorization-result-v1',ok:false,classification:$json.classification||'WF40_LIVE_AUTHORIZATION_GATE_CLOSED',task_id:$json.task_id||null,packet_id:$json.packet_id||null,execution_performed:false}};"""

PREPARE_ADAPTER_JS = r"""const live=$('Code - Build explicit WF40 dispatch + runtime authorization').item.json??{};const routing=$('Code - Parse V4 execution routing bridge result').item.json??{};const bridge=routing.bridge_result??null;const cycle=$('Execute Workflow - WF61 primary remote planner').item.json??{};const route=(bridge&&bridge.execution_route_result&&typeof bridge.execution_route_result==='object')?bridge.execution_route_result:null;const packet=(cycle.packet&&typeof cycle.packet==='object')?cycle.packet:null;const dispatch=(live.dispatch_result&&typeof live.dispatch_result==='object'&&!Array.isArray(live.dispatch_result))?live.dispatch_result:null;const auth=(live.runtime_authorization&&typeof live.runtime_authorization==='object'&&!Array.isArray(live.runtime_authorization))?live.runtime_authorization:null;const ready=Boolean(live.sidecars_ready===true&&routing.routing_ready_for_dispatch===true&&bridge&&bridge.classification==='ROUTING_READY_FOR_DISPATCH'&&route&&packet&&dispatch&&auth);const task=String(cycle.task_id||bridge?.task_id||'');const packetId=String(packet?.packet_id||bridge?.packet_id||'');const req=ready?{schema_version:'n8n-v4-execution-adapter-router-bridge-input-v1',execution_id:String(live.execution_id||('wf40:'+task+':'+packetId)),execution_route_result:route,execution_packet:packet,dispatch_result:dispatch,runtime_authorization:auth}:null;const b64=req?Buffer.from(JSON.stringify(req),'utf8').toString('base64'):null;return {json:{schema:'wf40-v4-execution-adapter-router-input-v1',task_id:task,packet_id:packetId,adapter_router_input_ready:ready,input_b64:b64,dispatch_supplied:Boolean(dispatch),runtime_authorization_supplied:Boolean(auth),execution_performed:false}};"""

# Transport prepare: only change side.dispatch/auth source to Build node; keep all other checks.
PREPARE_TRANSPORT_JS = None  # filled from live node with surgical replacements


def node_by_id(wf, node_id):
    for n in wf["nodes"]:
        if n.get("id") == node_id:
            return n
    raise KeyError(node_id)


def node_by_name(wf, name):
    for n in wf["nodes"]:
        if n.get("name") == name:
            return n
    raise KeyError(name)


def set_connection(wf, from_name, outputs):
    wf.setdefault("connections", {})[from_name] = {"main": outputs}


def main():
    src = Path(sys.argv[1])
    dst = Path(sys.argv[2])
    wf = json.loads(src.read_text(encoding="utf-8"))
    if isinstance(wf, list):
        wf = wf[0]

    assert wf.get("id") == WF_ID, wf.get("id")
    assert wf.get("active") is True
    assert wf.get("versionId") == EXPECTED_VERSION, wf.get("versionId")
    assert len(wf.get("nodes", [])) == EXPECTED_NODES, len(wf.get("nodes", []))
    for nid in NEW_IDS:
        if any(n.get("id") == nid for n in wf["nodes"]):
            raise SystemExit(f"new id already exists: {nid}")

    # Capture original transport js for surgical edit.
    transport = node_by_id(wf, PREPARE_TRANSPORT_ID)
    transport_js = transport["parameters"]["jsCode"]
    if "Code - Capture explicit V4 execution routing sidecar" not in transport_js:
        raise SystemExit("transport js missing expected capture reference")
    if "side.dispatch_result" not in transport_js or "side.runtime_authorization" not in transport_js:
        raise SystemExit("transport js missing side dispatch/auth reads")

    # Replace capture-based dispatch/auth with Build-node sidecars; keep capture for nothing else if unused.
    # Original reads: const side=$('Code - Capture...'); const dispatch=(side.dispatch_result...; const auth=(side.runtime_authorization...
    transport_js2 = transport_js.replace(
        "const side=$('Code - Capture explicit V4 execution routing sidecar').item.json??{};const cycle=$('Execute Workflow - WF61 primary remote planner').item.json??{};const dispatch=(side.dispatch_result&&typeof side.dispatch_result==='object'&&!Array.isArray(side.dispatch_result))?side.dispatch_result:null;const auth=(side.runtime_authorization&&typeof side.runtime_authorization==='object'&&!Array.isArray(side.runtime_authorization))?side.runtime_authorization:null;",
        "const live=$('Code - Build explicit WF40 dispatch + runtime authorization').item.json??{};const cycle=$('Execute Workflow - WF61 primary remote planner').item.json??{};const dispatch=(live.dispatch_result&&typeof live.dispatch_result==='object'&&!Array.isArray(live.dispatch_result))?live.dispatch_result:null;const auth=(live.runtime_authorization&&typeof live.runtime_authorization==='object'&&!Array.isArray(live.runtime_authorization))?live.runtime_authorization:null;",
        1,
    )
    if transport_js2 == transport_js:
        raise SystemExit("failed to surgically update transport prepare js")

    adapter = node_by_id(wf, PREPARE_ADAPTER_ID)
    adapter["parameters"]["jsCode"] = PREPARE_ADAPTER_JS
    transport["parameters"]["jsCode"] = transport_js2

    new_nodes = [
        {
            "parameters": {"mode": "runOnceForEachItem", "jsCode": PREPARE_PROPOSAL_JS},
            "id": NEW_IDS[0],
            "name": "Code - Prepare WF40 live execution proposal",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [3000, 1200],
        },
        {
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 1},
                    "conditions": [{
                        "id": "wf40-live-proposal-ready",
                        "leftValue": "={{ $json.proposal_ready }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "equals"},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
            "id": NEW_IDS[1],
            "name": "IF - WF40 live proposal ready?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [3240, 1200],
        },
        {
            "parameters": {
                "method": "POST",
                "url": "https://asusdesktop.tailc01234.ts.net/v4/authorization/register-pending",
                "sendHeaders": True,
                "headerParameters": {"parameters": [{"name": "Content-Type", "value": "application/json"}]},
                "sendBody": True,
                "contentType": "raw",
                "rawContentType": "application/json",
                "body": "={{ JSON.stringify($json.register_request) }}",
                "options": {"timeout": 20000},
            },
            "id": NEW_IDS[2],
            "name": "HTTP - Register WF40 runtime authorization",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [3480, 1120],
            "onError": "continueRegularOutput",
            "alwaysOutputData": True,
        },
        {
            "parameters": {"mode": "runOnceForEachItem", "jsCode": PARSE_REGISTER_JS},
            "id": NEW_IDS[3],
            "name": "Code - Parse WF40 authorization register",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [3720, 1120],
        },
        {
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 1},
                    "conditions": [{
                        "id": "wf40-auth-pending",
                        "leftValue": "={{ $json.pending }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "equals"},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
            "id": NEW_IDS[4],
            "name": "IF - WF40 authorization pending?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [3960, 1120],
        },
        {
            "parameters": {"resume": "timeInterval", "amount": 3, "unit": "seconds"},
            "id": NEW_IDS[5],
            "name": "Wait - WF40 authorization poll",
            "type": "n8n-nodes-base.wait",
            "typeVersion": 1.1,
            "position": [4200, 1040],
            "webhookId": "v4f40-wf40-auth-poll-wait",
        },
        {
            "parameters": {
                "method": "POST",
                "url": "https://asusdesktop.tailc01234.ts.net/v4/authorization/status",
                "sendHeaders": True,
                "headerParameters": {"parameters": [{"name": "Content-Type", "value": "application/json"}]},
                "sendBody": True,
                "contentType": "raw",
                "rawContentType": "application/json",
                "body": "={{ JSON.stringify($json.status_request) }}",
                "options": {"timeout": 20000},
            },
            "id": NEW_IDS[6],
            "name": "HTTP - Poll WF40 authorization status",
            "type": "n8n-nodes-base.httpRequest",
            "typeVersion": 4.2,
            "position": [4440, 1040],
            "onError": "continueRegularOutput",
            "alwaysOutputData": True,
        },
        {
            "parameters": {"mode": "runOnceForEachItem", "jsCode": PARSE_STATUS_JS},
            "id": NEW_IDS[7],
            "name": "Code - Parse WF40 authorization status",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [4680, 1040],
        },
        {
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 1},
                    "conditions": [{
                        "id": "wf40-auth-issued",
                        "leftValue": "={{ $json.issued }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "equals"},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
            "id": NEW_IDS[8],
            "name": "IF - WF40 authorization issued?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [4920, 1040],
        },
        {
            "parameters": {
                "conditions": {
                    "options": {"caseSensitive": True, "leftValue": "", "typeValidation": "strict", "version": 1},
                    "conditions": [{
                        "id": "wf40-auth-still-pending",
                        "leftValue": "={{ $json.still_pending }}",
                        "rightValue": True,
                        "operator": {"type": "boolean", "operation": "equals"},
                    }],
                    "combinator": "and",
                },
                "options": {},
            },
            "id": NEW_IDS[9],
            "name": "IF - WF40 authorization still pending?",
            "type": "n8n-nodes-base.if",
            "typeVersion": 2,
            "position": [5160, 1160],
        },
        {
            "parameters": {"mode": "runOnceForEachItem", "jsCode": BUILD_SIDECARS_JS},
            "id": NEW_IDS[10],
            "name": "Code - Build explicit WF40 dispatch + runtime authorization",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [5160, 920],
        },
        {
            "parameters": {"mode": "runOnceForEachItem", "jsCode": GATE_CLOSED_JS},
            "id": NEW_IDS[11],
            "name": "Code - WF40 live authorization gate closed",
            "type": "n8n-nodes-base.code",
            "typeVersion": 2,
            "position": [3480, 1360],
        },
    ]

    wf["nodes"].extend(new_nodes)

    # Rewire Parse routing bridge -> live proposal instead of prepare adapter.
    set_connection(
        wf,
        "Code - Parse V4 execution routing bridge result",
        [[{"node": "Code - Prepare WF40 live execution proposal", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "Code - Prepare WF40 live execution proposal",
        [[{"node": "IF - WF40 live proposal ready?", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "IF - WF40 live proposal ready?",
        [
            [{"node": "HTTP - Register WF40 runtime authorization", "type": "main", "index": 0}],
            [{"node": "Code - WF40 live authorization gate closed", "type": "main", "index": 0}],
        ],
    )
    set_connection(
        wf,
        "HTTP - Register WF40 runtime authorization",
        [[{"node": "Code - Parse WF40 authorization register", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "Code - Parse WF40 authorization register",
        [[{"node": "IF - WF40 authorization pending?", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "IF - WF40 authorization pending?",
        [
            [{"node": "Wait - WF40 authorization poll", "type": "main", "index": 0}],
            [{"node": "Code - WF40 live authorization gate closed", "type": "main", "index": 0}],
        ],
    )
    set_connection(
        wf,
        "Wait - WF40 authorization poll",
        [[{"node": "HTTP - Poll WF40 authorization status", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "HTTP - Poll WF40 authorization status",
        [[{"node": "Code - Parse WF40 authorization status", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "Code - Parse WF40 authorization status",
        [[{"node": "IF - WF40 authorization issued?", "type": "main", "index": 0}]],
    )
    set_connection(
        wf,
        "IF - WF40 authorization issued?",
        [
            [{"node": "Code - Build explicit WF40 dispatch + runtime authorization", "type": "main", "index": 0}],
            [{"node": "IF - WF40 authorization still pending?", "type": "main", "index": 0}],
        ],
    )
    set_connection(
        wf,
        "IF - WF40 authorization still pending?",
        [
            [{"node": "Wait - WF40 authorization poll", "type": "main", "index": 0}],
            [{"node": "Code - WF40 live authorization gate closed", "type": "main", "index": 0}],
        ],
    )
    set_connection(
        wf,
        "Code - Build explicit WF40 dispatch + runtime authorization",
        [[{"node": "Code - Prepare V4 execution adapter router input", "type": "main", "index": 0}]],
    )

    # Preserve prepare-adapter -> IF connection (already present).
    assert len(wf["nodes"]) == EXPECTED_NODES + len(NEW_IDS)
    dst.write_text(json.dumps(wf, ensure_ascii=False), encoding="utf-8")
    print(json.dumps({
        "ok": True,
        "nodes_before": EXPECTED_NODES,
        "nodes_after": len(wf["nodes"]),
        "new_nodes": len(NEW_IDS),
        "adapter_updated": True,
        "transport_updated": True,
    }))


if __name__ == "__main__":
    main()
