/**
 * BPMN 2.0 流程定义（含泳道）
 * 每种使用模式对应一个标准 BPMN XML
 */

export interface BpmnFlow {
  id: string;
  name: string;
  description: string;
  xml: string;
}

// ==================== 1. AI 级联推导（含泳道） ====================
const cascadeFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_cascade"
             targetNamespace="http://pyramid.canvas/bpmn">
  <collaboration id="Collab_Cascade">
    <participant id="Pool_Cascade" name="AI 级联推导流程" processRef="Process_Cascade" />
  </collaboration>
  <process id="Process_Cascade" name="AI 级联推导流程" isExecutable="false">
    <laneSet id="LS_Cascade">
      <lane id="Lane_User" name="用户操作">
        <flowNodeRef>Start_1</flowNodeRef>
        <flowNodeRef>Task_Intent</flowNodeRef>
        <flowNodeRef>Gw_IntentOk</flowNodeRef>
        <flowNodeRef>Task_L6_Review</flowNodeRef>
        <flowNodeRef>Task_L5_Review</flowNodeRef>
        <flowNodeRef>Task_L4_Review</flowNodeRef>
        <flowNodeRef>Task_L3_Review</flowNodeRef>
        <flowNodeRef>Task_SelectMeth</flowNodeRef>
        <flowNodeRef>Task_L2_Review</flowNodeRef>
        <flowNodeRef>Task_L1_Review</flowNodeRef>
        <flowNodeRef>Task_L0_Review</flowNodeRef>
        <flowNodeRef>End_1</flowNodeRef>
      </lane>
      <lane id="Lane_AI" name="AI 系统">
        <flowNodeRef>Task_Analyze</flowNodeRef>
        <flowNodeRef>Task_L6</flowNodeRef>
        <flowNodeRef>Task_L5</flowNodeRef>
        <flowNodeRef>Task_L4</flowNodeRef>
        <flowNodeRef>Task_L3</flowNodeRef>
        <flowNodeRef>Task_SearchMeth</flowNodeRef>
        <flowNodeRef>Task_L1</flowNodeRef>
        <flowNodeRef>Task_L0</flowNodeRef>
      </lane>
    </laneSet>

    <startEvent id="Start_1" name="开始">
      <outgoing>Flow_1</outgoing>
    </startEvent>
    <userTask id="Task_Intent" name="描述意图&#10;（自然语言）">
      <incoming>Flow_1</incoming>
      <incoming>Flow_4b</incoming>
      <outgoing>Flow_2</outgoing>
    </userTask>
    <serviceTask id="Task_Analyze" name="AI 分析意图&#10;领域/目标/维度/约束">
      <incoming>Flow_2</incoming>
      <outgoing>Flow_3</outgoing>
    </serviceTask>
    <exclusiveGateway id="Gw_IntentOk" name="意图正确？">
      <incoming>Flow_3</incoming>
      <outgoing>Flow_4</outgoing>
      <outgoing>Flow_4b</outgoing>
    </exclusiveGateway>

    <serviceTask id="Task_L6" name="AI 推导&#10;第6层 终极承诺">
      <incoming>Flow_4</incoming>
      <outgoing>Flow_5</outgoing>
    </serviceTask>
    <userTask id="Task_L6_Review" name="审阅确认&#10;终极承诺">
      <incoming>Flow_5</incoming>
      <outgoing>Flow_6</outgoing>
    </userTask>
    <serviceTask id="Task_L5" name="AI 推导&#10;第5层 世界观">
      <incoming>Flow_6</incoming>
      <outgoing>Flow_7</outgoing>
    </serviceTask>
    <userTask id="Task_L5_Review" name="审阅确认&#10;世界观">
      <incoming>Flow_7</incoming>
      <outgoing>Flow_8</outgoing>
    </userTask>
    <serviceTask id="Task_L4" name="AI 推导&#10;第4层 范式">
      <incoming>Flow_8</incoming>
      <outgoing>Flow_9</outgoing>
    </serviceTask>
    <userTask id="Task_L4_Review" name="审阅确认&#10;范式">
      <incoming>Flow_9</incoming>
      <outgoing>Flow_10</outgoing>
    </userTask>
    <serviceTask id="Task_L3" name="AI 推导&#10;第3层 元方法论">
      <incoming>Flow_10</incoming>
      <outgoing>Flow_11</outgoing>
    </serviceTask>
    <userTask id="Task_L3_Review" name="审阅确认&#10;元方法论">
      <incoming>Flow_11</incoming>
      <outgoing>Flow_12</outgoing>
    </userTask>

    <serviceTask id="Task_SearchMeth" name="AI 搜索&#10;真实方法论（4-5个）">
      <incoming>Flow_12</incoming>
      <outgoing>Flow_13</outgoing>
    </serviceTask>
    <userTask id="Task_SelectMeth" name="选定方法论&#10;并应用到第2层">
      <incoming>Flow_13</incoming>
      <outgoing>Flow_14</outgoing>
    </userTask>
    <userTask id="Task_L2_Review" name="审阅确认&#10;方法论">
      <incoming>Flow_14</incoming>
      <outgoing>Flow_15</outgoing>
    </userTask>

    <serviceTask id="Task_L1" name="AI 推导&#10;第1层 方法">
      <incoming>Flow_15</incoming>
      <outgoing>Flow_16</outgoing>
    </serviceTask>
    <userTask id="Task_L1_Review" name="审阅确认&#10;方法">
      <incoming>Flow_16</incoming>
      <outgoing>Flow_17</outgoing>
    </userTask>
    <serviceTask id="Task_L0" name="AI 推导&#10;第0层 问题卡">
      <incoming>Flow_17</incoming>
      <outgoing>Flow_18</outgoing>
    </serviceTask>
    <userTask id="Task_L0_Review" name="审阅确认&#10;问题卡">
      <incoming>Flow_18</incoming>
      <outgoing>Flow_19</outgoing>
    </userTask>
    <endEvent id="End_1" name="全部完成">
      <incoming>Flow_19</incoming>
    </endEvent>

    <sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_Intent" />
    <sequenceFlow id="Flow_2" sourceRef="Task_Intent" targetRef="Task_Analyze" />
    <sequenceFlow id="Flow_3" sourceRef="Task_Analyze" targetRef="Gw_IntentOk" />
    <sequenceFlow id="Flow_4" name="是" sourceRef="Gw_IntentOk" targetRef="Task_L6" />
    <sequenceFlow id="Flow_4b" name="否，重新描述" sourceRef="Gw_IntentOk" targetRef="Task_Intent" />
    <sequenceFlow id="Flow_5" sourceRef="Task_L6" targetRef="Task_L6_Review" />
    <sequenceFlow id="Flow_6" sourceRef="Task_L6_Review" targetRef="Task_L5" />
    <sequenceFlow id="Flow_7" sourceRef="Task_L5" targetRef="Task_L5_Review" />
    <sequenceFlow id="Flow_8" sourceRef="Task_L5_Review" targetRef="Task_L4" />
    <sequenceFlow id="Flow_9" sourceRef="Task_L4" targetRef="Task_L4_Review" />
    <sequenceFlow id="Flow_10" sourceRef="Task_L4_Review" targetRef="Task_L3" />
    <sequenceFlow id="Flow_11" sourceRef="Task_L3" targetRef="Task_L3_Review" />
    <sequenceFlow id="Flow_12" sourceRef="Task_L3_Review" targetRef="Task_SearchMeth" />
    <sequenceFlow id="Flow_13" sourceRef="Task_SearchMeth" targetRef="Task_SelectMeth" />
    <sequenceFlow id="Flow_14" sourceRef="Task_SelectMeth" targetRef="Task_L2_Review" />
    <sequenceFlow id="Flow_15" sourceRef="Task_L2_Review" targetRef="Task_L1" />
    <sequenceFlow id="Flow_16" sourceRef="Task_L1" targetRef="Task_L1_Review" />
    <sequenceFlow id="Flow_17" sourceRef="Task_L1_Review" targetRef="Task_L0" />
    <sequenceFlow id="Flow_18" sourceRef="Task_L0" targetRef="Task_L0_Review" />
    <sequenceFlow id="Flow_19" sourceRef="Task_L0_Review" targetRef="End_1" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collab_Cascade">
      <!-- Pool -->
      <bpmndi:BPMNShape id="Shape_Pool" bpmnElement="Pool_Cascade" isHorizontal="true">
        <dc:Bounds x="120" y="60" width="3500" height="440" />
      </bpmndi:BPMNShape>
      <!-- User Lane -->
      <bpmndi:BPMNShape id="Shape_Lane_User" bpmnElement="Lane_User" isHorizontal="true">
        <dc:Bounds x="150" y="60" width="3470" height="220" />
      </bpmndi:BPMNShape>
      <!-- AI Lane -->
      <bpmndi:BPMNShape id="Shape_Lane_AI" bpmnElement="Lane_AI" isHorizontal="true">
        <dc:Bounds x="150" y="280" width="3470" height="220" />
      </bpmndi:BPMNShape>

      <!-- User Lane elements (center y ≈ 170) -->
      <bpmndi:BPMNShape id="S_Start" bpmnElement="Start_1"><dc:Bounds x="202" y="152" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_Intent" bpmnElement="Task_Intent"><dc:Bounds x="290" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GwIntent" bpmnElement="Gw_IntentOk" isMarkerVisible="true"><dc:Bounds x="610" y="145" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L6R" bpmnElement="Task_L6_Review"><dc:Bounds x="870" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L5R" bpmnElement="Task_L5_Review"><dc:Bounds x="1190" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L4R" bpmnElement="Task_L4_Review"><dc:Bounds x="1510" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L3R" bpmnElement="Task_L3_Review"><dc:Bounds x="1830" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_SelM" bpmnElement="Task_SelectMeth"><dc:Bounds x="2310" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L2R" bpmnElement="Task_L2_Review"><dc:Bounds x="2490" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L1R" bpmnElement="Task_L1_Review"><dc:Bounds x="2810" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L0R" bpmnElement="Task_L0_Review"><dc:Bounds x="3130" y="130" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_End" bpmnElement="End_1"><dc:Bounds x="3362" y="152" width="36" height="36" /></bpmndi:BPMNShape>

      <!-- AI Lane elements (center y ≈ 390) -->
      <bpmndi:BPMNShape id="S_Analyze" bpmnElement="Task_Analyze"><dc:Bounds x="470" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L6" bpmnElement="Task_L6"><dc:Bounds x="710" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L5" bpmnElement="Task_L5"><dc:Bounds x="1030" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L4" bpmnElement="Task_L4"><dc:Bounds x="1350" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L3" bpmnElement="Task_L3"><dc:Bounds x="1670" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_SM" bpmnElement="Task_SearchMeth"><dc:Bounds x="2130" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L1" bpmnElement="Task_L1"><dc:Bounds x="2650" y="350" width="130" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_L0" bpmnElement="Task_L0"><dc:Bounds x="2970" y="350" width="130" height="80" /></bpmndi:BPMNShape>

      <!-- Edges -->
      <bpmndi:BPMNEdge id="E1" bpmnElement="Flow_1"><di:waypoint x="238" y="170" /><di:waypoint x="290" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E2" bpmnElement="Flow_2"><di:waypoint x="420" y="170" /><di:waypoint x="445" y="170" /><di:waypoint x="445" y="390" /><di:waypoint x="470" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E3" bpmnElement="Flow_3"><di:waypoint x="600" y="390" /><di:waypoint x="635" y="390" /><di:waypoint x="635" y="195" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E4" bpmnElement="Flow_4"><di:waypoint x="660" y="170" /><di:waypoint x="685" y="170" /><di:waypoint x="685" y="390" /><di:waypoint x="710" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E4b" bpmnElement="Flow_4b"><di:waypoint x="635" y="145" /><di:waypoint x="635" y="100" /><di:waypoint x="355" y="100" /><di:waypoint x="355" y="130" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E5" bpmnElement="Flow_5"><di:waypoint x="840" y="390" /><di:waypoint x="855" y="390" /><di:waypoint x="855" y="170" /><di:waypoint x="870" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E6" bpmnElement="Flow_6"><di:waypoint x="1000" y="170" /><di:waypoint x="1015" y="170" /><di:waypoint x="1015" y="390" /><di:waypoint x="1030" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E7" bpmnElement="Flow_7"><di:waypoint x="1160" y="390" /><di:waypoint x="1175" y="390" /><di:waypoint x="1175" y="170" /><di:waypoint x="1190" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E8" bpmnElement="Flow_8"><di:waypoint x="1320" y="170" /><di:waypoint x="1335" y="170" /><di:waypoint x="1335" y="390" /><di:waypoint x="1350" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E9" bpmnElement="Flow_9"><di:waypoint x="1480" y="390" /><di:waypoint x="1495" y="390" /><di:waypoint x="1495" y="170" /><di:waypoint x="1510" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E10" bpmnElement="Flow_10"><di:waypoint x="1640" y="170" /><di:waypoint x="1655" y="170" /><di:waypoint x="1655" y="390" /><di:waypoint x="1670" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E11" bpmnElement="Flow_11"><di:waypoint x="1800" y="390" /><di:waypoint x="1815" y="390" /><di:waypoint x="1815" y="170" /><di:waypoint x="1830" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E12" bpmnElement="Flow_12"><di:waypoint x="1960" y="170" /><di:waypoint x="2045" y="170" /><di:waypoint x="2045" y="390" /><di:waypoint x="2130" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E13" bpmnElement="Flow_13"><di:waypoint x="2260" y="390" /><di:waypoint x="2285" y="390" /><di:waypoint x="2285" y="170" /><di:waypoint x="2310" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E14" bpmnElement="Flow_14"><di:waypoint x="2440" y="170" /><di:waypoint x="2490" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E15" bpmnElement="Flow_15"><di:waypoint x="2620" y="170" /><di:waypoint x="2635" y="170" /><di:waypoint x="2635" y="390" /><di:waypoint x="2650" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E16" bpmnElement="Flow_16"><di:waypoint x="2780" y="390" /><di:waypoint x="2795" y="390" /><di:waypoint x="2795" y="170" /><di:waypoint x="2810" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E17" bpmnElement="Flow_17"><di:waypoint x="2940" y="170" /><di:waypoint x="2955" y="170" /><di:waypoint x="2955" y="390" /><di:waypoint x="2970" y="390" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E18" bpmnElement="Flow_18"><di:waypoint x="3100" y="390" /><di:waypoint x="3115" y="390" /><di:waypoint x="3115" y="170" /><di:waypoint x="3130" y="170" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E19" bpmnElement="Flow_19"><di:waypoint x="3260" y="170" /><di:waypoint x="3362" y="170" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

// ==================== 2. 一眼诊断（含泳道） ====================
const diagnosisFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_diagnosis"
             targetNamespace="http://pyramid.canvas/bpmn">
  <collaboration id="Collab_Diagnosis">
    <participant id="Pool_Diagnosis" name="一眼诊断流程" processRef="Process_Diagnosis" />
  </collaboration>
  <process id="Process_Diagnosis" name="一眼诊断流程" isExecutable="false">
    <laneSet id="LS_Diagnosis">
      <lane id="Lane_D_User" name="用户操作">
        <flowNodeRef>S1</flowNodeRef>
        <flowNodeRef>T_Describe</flowNodeRef>
        <flowNodeRef>T_ShowResult</flowNodeRef>
        <flowNodeRef>T_GoToLayer</flowNodeRef>
        <flowNodeRef>G_Resolved</flowNodeRef>
        <flowNodeRef>T_GoUp</flowNodeRef>
        <flowNodeRef>E1</flowNodeRef>
      </lane>
      <lane id="Lane_D_System" name="系统处理">
        <flowNodeRef>T_Match</flowNodeRef>
      </lane>
    </laneSet>

    <startEvent id="S1" name="遇到分歧"><outgoing>F1</outgoing></startEvent>
    <userTask id="T_Describe" name="描述争论焦点&#10;选择最匹配的选项"><incoming>F1</incoming><outgoing>F2</outgoing></userTask>
    <serviceTask id="T_Match" name="系统自动匹配&#10;分歧所在层级"><incoming>F2</incoming><outgoing>F3</outgoing></serviceTask>
    <userTask id="T_ShowResult" name="查看诊断结果&#10;定位问题层"><incoming>F3</incoming><outgoing>F4</outgoing></userTask>
    <userTask id="T_GoToLayer" name="跳转到该层&#10;逐字段对齐"><incoming>F4</incoming><outgoing>F5</outgoing></userTask>
    <exclusiveGateway id="G_Resolved" name="分歧解决？"><incoming>F5</incoming><outgoing>F6</outgoing><outgoing>F7</outgoing></exclusiveGateway>
    <userTask id="T_GoUp" name="向上追溯一层&#10;寻找更深层分歧"><incoming>F7</incoming><outgoing>F8</outgoing></userTask>
    <endEvent id="E1" name="分歧消除"><incoming>F6</incoming><incoming>F8</incoming></endEvent>

    <sequenceFlow id="F1" sourceRef="S1" targetRef="T_Describe" />
    <sequenceFlow id="F2" sourceRef="T_Describe" targetRef="T_Match" />
    <sequenceFlow id="F3" sourceRef="T_Match" targetRef="T_ShowResult" />
    <sequenceFlow id="F4" sourceRef="T_ShowResult" targetRef="T_GoToLayer" />
    <sequenceFlow id="F5" sourceRef="T_GoToLayer" targetRef="G_Resolved" />
    <sequenceFlow id="F6" name="是" sourceRef="G_Resolved" targetRef="E1" />
    <sequenceFlow id="F7" name="否，继续追溯" sourceRef="G_Resolved" targetRef="T_GoUp" />
    <sequenceFlow id="F8" sourceRef="T_GoUp" targetRef="E1" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_D">
    <bpmndi:BPMNPlane id="BPMNPlane_D" bpmnElement="Collab_Diagnosis">
      <!-- Pool -->
      <bpmndi:BPMNShape id="Shape_Pool_D" bpmnElement="Pool_Diagnosis" isHorizontal="true">
        <dc:Bounds x="120" y="60" width="1400" height="440" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Lane_DU" bpmnElement="Lane_D_User" isHorizontal="true">
        <dc:Bounds x="150" y="60" width="1370" height="280" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Lane_DS" bpmnElement="Lane_D_System" isHorizontal="true">
        <dc:Bounds x="150" y="340" width="1370" height="160" />
      </bpmndi:BPMNShape>

      <!-- User Lane (center y ≈ 200) -->
      <bpmndi:BPMNShape id="S_S1d" bpmnElement="S1"><dc:Bounds x="202" y="182" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_TD" bpmnElement="T_Describe"><dc:Bounds x="290" y="160" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_SR" bpmnElement="T_ShowResult"><dc:Bounds x="620" y="160" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GL" bpmnElement="T_GoToLayer"><dc:Bounds x="810" y="160" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GR" bpmnElement="G_Resolved" isMarkerVisible="true"><dc:Bounds x="1005" y="175" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GU_d" bpmnElement="T_GoUp"><dc:Bounds x="1100" y="80" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_E1d" bpmnElement="E1"><dc:Bounds x="1340" y="182" width="36" height="36" /></bpmndi:BPMNShape>

      <!-- System Lane (center y ≈ 420) -->
      <bpmndi:BPMNShape id="S_TM" bpmnElement="T_Match"><dc:Bounds x="460" y="380" width="140" height="80" /></bpmndi:BPMNShape>

      <!-- Edges -->
      <bpmndi:BPMNEdge id="E_F1d" bpmnElement="F1"><di:waypoint x="238" y="200" /><di:waypoint x="290" y="200" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F2d" bpmnElement="F2"><di:waypoint x="430" y="200" /><di:waypoint x="445" y="200" /><di:waypoint x="445" y="420" /><di:waypoint x="460" y="420" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F3d" bpmnElement="F3"><di:waypoint x="600" y="420" /><di:waypoint x="610" y="420" /><di:waypoint x="610" y="200" /><di:waypoint x="620" y="200" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F4d" bpmnElement="F4"><di:waypoint x="760" y="200" /><di:waypoint x="810" y="200" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F5d" bpmnElement="F5"><di:waypoint x="950" y="200" /><di:waypoint x="1005" y="200" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F6d" bpmnElement="F6"><di:waypoint x="1055" y="200" /><di:waypoint x="1340" y="200" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F7d" bpmnElement="F7"><di:waypoint x="1030" y="175" /><di:waypoint x="1030" y="120" /><di:waypoint x="1100" y="120" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F8d" bpmnElement="F8"><di:waypoint x="1240" y="120" /><di:waypoint x="1358" y="120" /><di:waypoint x="1358" y="182" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

// ==================== 3. 方法论搜索与应用（含泳道） ====================
const methodologyFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_methodology"
             targetNamespace="http://pyramid.canvas/bpmn">
  <collaboration id="Collab_Methodology">
    <participant id="Pool_Methodology" name="方法论搜索与应用流程" processRef="Process_Methodology" />
  </collaboration>
  <process id="Process_Methodology" name="方法论搜索与应用流程" isExecutable="false">
    <laneSet id="LS_Methodology">
      <lane id="Lane_M_User" name="用户操作">
        <flowNodeRef>S1</flowNodeRef>
        <flowNodeRef>G_Upper</flowNodeRef>
        <flowNodeRef>T_FillUpper</flowNodeRef>
        <flowNodeRef>T_InputQuery</flowNodeRef>
        <flowNodeRef>T_Browse</flowNodeRef>
        <flowNodeRef>T_Select</flowNodeRef>
        <flowNodeRef>T_Review</flowNodeRef>
        <flowNodeRef>E1</flowNodeRef>
      </lane>
      <lane id="Lane_M_AI" name="AI 系统">
        <flowNodeRef>T_AISearch</flowNodeRef>
        <flowNodeRef>T_Apply</flowNodeRef>
      </lane>
    </laneSet>

    <startEvent id="S1" name="进入方法论库"><outgoing>F1</outgoing></startEvent>
    <exclusiveGateway id="G_Upper" name="上层已填写？"><incoming>F1</incoming><outgoing>F2</outgoing><outgoing>F3</outgoing></exclusiveGateway>
    <userTask id="T_FillUpper" name="先填写上层&#10;（第3-6层）"><incoming>F3</incoming><outgoing>F3b</outgoing></userTask>
    <userTask id="T_InputQuery" name="输入搜索条件&#10;（可选）"><incoming>F2</incoming><incoming>F3b</incoming><outgoing>F4</outgoing></userTask>
    <serviceTask id="T_AISearch" name="AI 搜索&#10;4-5个真实方法论"><incoming>F4</incoming><outgoing>F5</outgoing></serviceTask>
    <userTask id="T_Browse" name="浏览方法论&#10;查看详情"><incoming>F5</incoming><outgoing>F6</outgoing></userTask>
    <userTask id="T_Select" name="星标选定&#10;主方案 + 备选"><incoming>F6</incoming><outgoing>F7</outgoing></userTask>
    <serviceTask id="T_Apply" name="一键应用&#10;到第2层"><incoming>F7</incoming><outgoing>F8</outgoing></serviceTask>
    <userTask id="T_Review" name="审阅方法论层&#10;微调字段"><incoming>F8</incoming><outgoing>F9</outgoing></userTask>
    <endEvent id="E1" name="方法论确定"><incoming>F9</incoming></endEvent>

    <sequenceFlow id="F1" sourceRef="S1" targetRef="G_Upper" />
    <sequenceFlow id="F2" name="是" sourceRef="G_Upper" targetRef="T_InputQuery" />
    <sequenceFlow id="F3" name="否" sourceRef="G_Upper" targetRef="T_FillUpper" />
    <sequenceFlow id="F3b" sourceRef="T_FillUpper" targetRef="T_InputQuery" />
    <sequenceFlow id="F4" sourceRef="T_InputQuery" targetRef="T_AISearch" />
    <sequenceFlow id="F5" sourceRef="T_AISearch" targetRef="T_Browse" />
    <sequenceFlow id="F6" sourceRef="T_Browse" targetRef="T_Select" />
    <sequenceFlow id="F7" sourceRef="T_Select" targetRef="T_Apply" />
    <sequenceFlow id="F8" sourceRef="T_Apply" targetRef="T_Review" />
    <sequenceFlow id="F9" sourceRef="T_Review" targetRef="E1" />
  </process>
  <bpmndi:BPMNDiagram id="BPMNDiagram_M">
    <bpmndi:BPMNPlane id="BPMNPlane_M" bpmnElement="Collab_Methodology">
      <!-- Pool -->
      <bpmndi:BPMNShape id="Shape_Pool_M" bpmnElement="Pool_Methodology" isHorizontal="true">
        <dc:Bounds x="120" y="60" width="1600" height="440" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Lane_MU" bpmnElement="Lane_M_User" isHorizontal="true">
        <dc:Bounds x="150" y="60" width="1570" height="260" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Lane_MAI" bpmnElement="Lane_M_AI" isHorizontal="true">
        <dc:Bounds x="150" y="320" width="1570" height="180" />
      </bpmndi:BPMNShape>

      <!-- User Lane (center y ≈ 190) -->
      <bpmndi:BPMNShape id="S_S1m" bpmnElement="S1"><dc:Bounds x="202" y="172" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GUm" bpmnElement="G_Upper" isMarkerVisible="true"><dc:Bounds x="290" y="165" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_FU" bpmnElement="T_FillUpper"><dc:Bounds x="400" y="80" width="130" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_IQ" bpmnElement="T_InputQuery"><dc:Bounds x="400" y="200" width="130" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_BR" bpmnElement="T_Browse"><dc:Bounds x="750" y="155" width="130" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_SL" bpmnElement="T_Select"><dc:Bounds x="930" y="155" width="130" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_RV" bpmnElement="T_Review"><dc:Bounds x="1310" y="155" width="130" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_E1m" bpmnElement="E1"><dc:Bounds x="1530" y="172" width="36" height="36" /></bpmndi:BPMNShape>

      <!-- AI Lane (center y ≈ 410) -->
      <bpmndi:BPMNShape id="S_AS" bpmnElement="T_AISearch"><dc:Bounds x="580" y="370" width="130" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_AP" bpmnElement="T_Apply"><dc:Bounds x="1110" y="370" width="130" height="70" /></bpmndi:BPMNShape>

      <!-- Edges -->
      <bpmndi:BPMNEdge id="E_F1m" bpmnElement="F1"><di:waypoint x="238" y="190" /><di:waypoint x="290" y="190" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F2m" bpmnElement="F2"><di:waypoint x="315" y="215" /><di:waypoint x="315" y="235" /><di:waypoint x="400" y="235" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F3m" bpmnElement="F3"><di:waypoint x="315" y="165" /><di:waypoint x="315" y="115" /><di:waypoint x="400" y="115" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F3bm" bpmnElement="F3b"><di:waypoint x="465" y="150" /><di:waypoint x="465" y="200" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F4m" bpmnElement="F4"><di:waypoint x="530" y="235" /><di:waypoint x="555" y="235" /><di:waypoint x="555" y="405" /><di:waypoint x="580" y="405" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F5m" bpmnElement="F5"><di:waypoint x="710" y="405" /><di:waypoint x="730" y="405" /><di:waypoint x="730" y="190" /><di:waypoint x="750" y="190" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F6m" bpmnElement="F6"><di:waypoint x="880" y="190" /><di:waypoint x="930" y="190" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F7m" bpmnElement="F7"><di:waypoint x="1060" y="190" /><di:waypoint x="1085" y="190" /><di:waypoint x="1085" y="405" /><di:waypoint x="1110" y="405" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F8m" bpmnElement="F8"><di:waypoint x="1240" y="405" /><di:waypoint x="1275" y="405" /><di:waypoint x="1275" y="190" /><di:waypoint x="1310" y="190" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F9m" bpmnElement="F9"><di:waypoint x="1440" y="190" /><di:waypoint x="1530" y="190" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

// ==================== Export ====================

export const BPMN_FLOWS: BpmnFlow[] = [
  {
    id: 'cascade',
    name: 'AI 级联推导',
    description: '意图识别 → AI 逐层推导 → 方法论搜索 → 完成',
    xml: cascadeFlowXml,
  },
  {
    id: 'diagnosis',
    name: '一眼诊断',
    description: '描述争论 → 定位层级 → 跳转对齐',
    xml: diagnosisFlowXml,
  },
  {
    id: 'methodology',
    name: '方法论搜索与应用',
    description: '上层约束 → AI搜索 → 浏览选定 → 应用到画布',
    xml: methodologyFlowXml,
  },
];
