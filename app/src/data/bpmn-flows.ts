/**
 * BPMN 2.0 流程定义
 * 每种使用模式对应一个标准 BPMN XML
 */

export interface BpmnFlow {
  id: string;
  name: string;
  description: string;
  xml: string;
}

// ==================== 1. AI 级联推导 ====================
const cascadeFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_cascade"
             targetNamespace="http://pyramid.canvas/bpmn">
  <process id="Process_Cascade" name="AI 级联推导流程" isExecutable="false">
    <startEvent id="Start_1" name="开始">
      <outgoing>Flow_1</outgoing>
    </startEvent>
    <userTask id="Task_Intent" name="描述意图&#10;（自然语言）">
      <incoming>Flow_1</incoming>
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
    <sequenceFlow id="Flow_1" sourceRef="Start_1" targetRef="Task_Intent" />
    <sequenceFlow id="Flow_2" sourceRef="Task_Intent" targetRef="Task_Analyze" />
    <sequenceFlow id="Flow_3" sourceRef="Task_Analyze" targetRef="Gw_IntentOk" />
    <sequenceFlow id="Flow_4" name="是" sourceRef="Gw_IntentOk" targetRef="Task_L6" />
    <sequenceFlow id="Flow_4b" name="否，重新描述" sourceRef="Gw_IntentOk" targetRef="Task_Intent" />

    <serviceTask id="Task_L6" name="AI 生成&#10;第6层 终极承诺">
      <incoming>Flow_4</incoming>
      <outgoing>Flow_5</outgoing>
    </serviceTask>
    <userTask id="Task_L6_Review" name="审阅确认&#10;终极承诺">
      <incoming>Flow_5</incoming>
      <outgoing>Flow_6</outgoing>
    </userTask>
    <serviceTask id="Task_L5" name="AI 生成&#10;第5层 世界观">
      <incoming>Flow_6</incoming>
      <outgoing>Flow_7</outgoing>
    </serviceTask>
    <userTask id="Task_L5_Review" name="审阅确认&#10;世界观">
      <incoming>Flow_7</incoming>
      <outgoing>Flow_8</outgoing>
    </userTask>
    <serviceTask id="Task_L4" name="AI 生成&#10;第4层 范式">
      <incoming>Flow_8</incoming>
      <outgoing>Flow_9</outgoing>
    </serviceTask>
    <userTask id="Task_L4_Review" name="审阅确认&#10;范式">
      <incoming>Flow_9</incoming>
      <outgoing>Flow_10</outgoing>
    </userTask>
    <serviceTask id="Task_L3" name="AI 生成&#10;第3层 元方法论">
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

    <serviceTask id="Task_L1" name="AI 生成&#10;第1层 方法">
      <incoming>Flow_15</incoming>
      <outgoing>Flow_16</outgoing>
    </serviceTask>
    <userTask id="Task_L1_Review" name="审阅确认&#10;方法">
      <incoming>Flow_16</incoming>
      <outgoing>Flow_17</outgoing>
    </userTask>
    <serviceTask id="Task_L0" name="AI 生成&#10;第0层 问题卡">
      <incoming>Flow_17</incoming>
      <outgoing>Flow_18</outgoing>
    </serviceTask>
    <userTask id="Task_L0_Review" name="审阅确认&#10;问题卡">
      <incoming>Flow_18</incoming>
      <outgoing>Flow_19</outgoing>
    </userTask>
    <endEvent id="End_1" name="完成&#10;全部层级">
      <incoming>Flow_19</incoming>
    </endEvent>

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
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Process_Cascade">
      <bpmndi:BPMNShape id="Shape_Start" bpmnElement="Start_1"><dc:Bounds x="152" y="232" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Intent" bpmnElement="Task_Intent"><dc:Bounds x="240" y="210" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_Analyze" bpmnElement="Task_Analyze"><dc:Bounds x="410" y="210" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_GwIntent" bpmnElement="Gw_IntentOk" isMarkerVisible="true"><dc:Bounds x="585" y="225" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L6" bpmnElement="Task_L6"><dc:Bounds x="690" y="210" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L6R" bpmnElement="Task_L6_Review"><dc:Bounds x="860" y="210" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L5" bpmnElement="Task_L5"><dc:Bounds x="1030" y="210" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L5R" bpmnElement="Task_L5_Review"><dc:Bounds x="1200" y="210" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L4" bpmnElement="Task_L4"><dc:Bounds x="240" y="370" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L4R" bpmnElement="Task_L4_Review"><dc:Bounds x="410" y="370" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L3" bpmnElement="Task_L3"><dc:Bounds x="580" y="370" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L3R" bpmnElement="Task_L3_Review"><dc:Bounds x="750" y="370" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_SM" bpmnElement="Task_SearchMeth"><dc:Bounds x="920" y="370" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_SelM" bpmnElement="Task_SelectMeth"><dc:Bounds x="1090" y="370" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L2R" bpmnElement="Task_L2_Review"><dc:Bounds x="240" y="530" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L1" bpmnElement="Task_L1"><dc:Bounds x="410" y="530" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L1R" bpmnElement="Task_L1_Review"><dc:Bounds x="580" y="530" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L0" bpmnElement="Task_L0"><dc:Bounds x="750" y="530" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_L0R" bpmnElement="Task_L0_Review"><dc:Bounds x="920" y="530" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Shape_End" bpmnElement="End_1"><dc:Bounds x="1102" y="552" width="36" height="36" /></bpmndi:BPMNShape>

      <bpmndi:BPMNEdge id="Edge_1" bpmnElement="Flow_1"><di:waypoint x="188" y="250" /><di:waypoint x="240" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_2" bpmnElement="Flow_2"><di:waypoint x="360" y="250" /><di:waypoint x="410" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_3" bpmnElement="Flow_3"><di:waypoint x="530" y="250" /><di:waypoint x="585" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_4" bpmnElement="Flow_4"><di:waypoint x="635" y="250" /><di:waypoint x="690" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_4b" bpmnElement="Flow_4b"><di:waypoint x="610" y="225" /><di:waypoint x="610" y="170" /><di:waypoint x="300" y="170" /><di:waypoint x="300" y="210" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_5" bpmnElement="Flow_5"><di:waypoint x="810" y="250" /><di:waypoint x="860" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_6" bpmnElement="Flow_6"><di:waypoint x="980" y="250" /><di:waypoint x="1030" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_7" bpmnElement="Flow_7"><di:waypoint x="1150" y="250" /><di:waypoint x="1200" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_8" bpmnElement="Flow_8"><di:waypoint x="1260" y="290" /><di:waypoint x="1260" y="330" /><di:waypoint x="180" y="330" /><di:waypoint x="180" y="410" /><di:waypoint x="240" y="410" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_9" bpmnElement="Flow_9"><di:waypoint x="360" y="410" /><di:waypoint x="410" y="410" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_10" bpmnElement="Flow_10"><di:waypoint x="530" y="410" /><di:waypoint x="580" y="410" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_11" bpmnElement="Flow_11"><di:waypoint x="700" y="410" /><di:waypoint x="750" y="410" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_12" bpmnElement="Flow_12"><di:waypoint x="870" y="410" /><di:waypoint x="920" y="410" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_13" bpmnElement="Flow_13"><di:waypoint x="1040" y="410" /><di:waypoint x="1090" y="410" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_14" bpmnElement="Flow_14"><di:waypoint x="1150" y="450" /><di:waypoint x="1150" y="490" /><di:waypoint x="180" y="490" /><di:waypoint x="180" y="570" /><di:waypoint x="240" y="570" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_15" bpmnElement="Flow_15"><di:waypoint x="360" y="570" /><di:waypoint x="410" y="570" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_16" bpmnElement="Flow_16"><di:waypoint x="530" y="570" /><di:waypoint x="580" y="570" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_17" bpmnElement="Flow_17"><di:waypoint x="700" y="570" /><di:waypoint x="750" y="570" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_18" bpmnElement="Flow_18"><di:waypoint x="870" y="570" /><di:waypoint x="920" y="570" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Edge_19" bpmnElement="Flow_19"><di:waypoint x="1040" y="570" /><di:waypoint x="1102" y="570" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

// ==================== 2. 一眼诊断 ====================
const diagnosisFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_diagnosis"
             targetNamespace="http://pyramid.canvas/bpmn">
  <process id="Process_Diagnosis" name="一眼诊断流程" isExecutable="false">
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
  <bpmndi:BPMNDiagram id="BPMNDiagram_4">
    <bpmndi:BPMNPlane id="BPMNPlane_4" bpmnElement="Process_Diagnosis">
      <bpmndi:BPMNShape id="S_S1d" bpmnElement="S1"><dc:Bounds x="152" y="232" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_TD" bpmnElement="T_Describe"><dc:Bounds x="240" y="210" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_TM" bpmnElement="T_Match"><dc:Bounds x="430" y="210" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_SR" bpmnElement="T_ShowResult"><dc:Bounds x="620" y="210" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GL" bpmnElement="T_GoToLayer"><dc:Bounds x="810" y="210" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GR" bpmnElement="G_Resolved" isMarkerVisible="true"><dc:Bounds x="1005" y="225" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GU" bpmnElement="T_GoUp"><dc:Bounds x="1100" y="310" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_E1d" bpmnElement="E1"><dc:Bounds x="1152" y="162" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="E_F1d" bpmnElement="F1"><di:waypoint x="188" y="250" /><di:waypoint x="240" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F2d" bpmnElement="F2"><di:waypoint x="380" y="250" /><di:waypoint x="430" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F3d" bpmnElement="F3"><di:waypoint x="570" y="250" /><di:waypoint x="620" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F4d" bpmnElement="F4"><di:waypoint x="760" y="250" /><di:waypoint x="810" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F5d" bpmnElement="F5"><di:waypoint x="950" y="250" /><di:waypoint x="1005" y="250" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F6d" bpmnElement="F6"><di:waypoint x="1030" y="225" /><di:waypoint x="1030" y="180" /><di:waypoint x="1152" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F7d" bpmnElement="F7"><di:waypoint x="1030" y="275" /><di:waypoint x="1030" y="350" /><di:waypoint x="1100" y="350" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F8d" bpmnElement="F8"><di:waypoint x="1170" y="310" /><di:waypoint x="1170" y="198" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</definitions>`;

// ==================== 5. 方法论搜索与应用 ====================
const methodologyFlowXml = `<?xml version="1.0" encoding="UTF-8"?>
<definitions xmlns="http://www.omg.org/spec/BPMN/20100524/MODEL"
             xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
             xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
             xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
             id="Definitions_methodology"
             targetNamespace="http://pyramid.canvas/bpmn">
  <process id="Process_Methodology" name="方法论搜索与应用流程" isExecutable="false">
    <startEvent id="S1" name="进入方法论库"><outgoing>F1</outgoing></startEvent>
    <exclusiveGateway id="G_Upper" name="上层已填写？"><incoming>F1</incoming><outgoing>F2</outgoing><outgoing>F3</outgoing></exclusiveGateway>
    <userTask id="T_FillUpper" name="先填写上层&#10;（第3-6层）"><incoming>F3</incoming><outgoing>F3b</outgoing></userTask>
    <userTask id="T_InputQuery" name="输入搜索条件&#10;（可选）"><incoming>F2</incoming><incoming>F3b</incoming><outgoing>F4</outgoing></userTask>
    <serviceTask id="T_AISearch" name="AI 搜索&#10;4-5个真实方法论"><incoming>F4</incoming><outgoing>F5</outgoing></serviceTask>
    <userTask id="T_Browse" name="浏览方法论&#10;查看详情&#10;优劣/步骤/来源"><incoming>F5</incoming><outgoing>F6</outgoing></userTask>
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
  <bpmndi:BPMNDiagram id="BPMNDiagram_5">
    <bpmndi:BPMNPlane id="BPMNPlane_5" bpmnElement="Process_Methodology">
      <bpmndi:BPMNShape id="S_S1m" bpmnElement="S1"><dc:Bounds x="152" y="282" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_GU" bpmnElement="G_Upper" isMarkerVisible="true"><dc:Bounds x="240" y="275" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_FU" bpmnElement="T_FillUpper"><dc:Bounds x="340" y="180" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_IQ" bpmnElement="T_InputQuery"><dc:Bounds x="340" y="340" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_AS" bpmnElement="T_AISearch"><dc:Bounds x="520" y="340" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_BR" bpmnElement="T_Browse"><dc:Bounds x="700" y="340" width="140" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_SL" bpmnElement="T_Select"><dc:Bounds x="900" y="340" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_AP" bpmnElement="T_Apply"><dc:Bounds x="1080" y="340" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_RV" bpmnElement="T_Review"><dc:Bounds x="1080" y="200" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="S_E1m" bpmnElement="E1"><dc:Bounds x="1262" y="222" width="36" height="36" /></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="E_F1m" bpmnElement="F1"><di:waypoint x="188" y="300" /><di:waypoint x="240" y="300" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F2m" bpmnElement="F2"><di:waypoint x="265" y="325" /><di:waypoint x="265" y="380" /><di:waypoint x="340" y="380" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F3m" bpmnElement="F3"><di:waypoint x="265" y="275" /><di:waypoint x="265" y="220" /><di:waypoint x="340" y="220" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F3bm" bpmnElement="F3b"><di:waypoint x="400" y="260" /><di:waypoint x="400" y="340" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F4m" bpmnElement="F4"><di:waypoint x="460" y="380" /><di:waypoint x="520" y="380" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F5m" bpmnElement="F5"><di:waypoint x="640" y="380" /><di:waypoint x="700" y="380" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F6m" bpmnElement="F6"><di:waypoint x="840" y="380" /><di:waypoint x="900" y="380" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F7m" bpmnElement="F7"><di:waypoint x="1020" y="380" /><di:waypoint x="1080" y="380" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F8m" bpmnElement="F8"><di:waypoint x="1140" y="340" /><di:waypoint x="1140" y="280" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_F9m" bpmnElement="F9"><di:waypoint x="1200" y="240" /><di:waypoint x="1262" y="240" /></bpmndi:BPMNEdge>
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
