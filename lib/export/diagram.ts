import { BaseModels } from '@voiceflow/base-types';
import { Utils } from '@voiceflow/common';

export const assignStepPorts = ({
  step,
  nodeStepsMap,
  nodeToFirstStepMap,
}: {
  step: BaseModels.AnyBaseStep;
  nodeStepsMap: Record<string, string>;
  nodeToFirstStepMap: Record<string, string>;
}): BaseModels.AnyBaseStep => {
  const assignNextStep = (port: BaseModels.BasePort) => {
    // TODO: filter by specific flag/property in the port
    if (step.nodeID in nodeStepsMap) {
      return { ...port, target: nodeStepsMap[step.nodeID] };
    }

    return port;
  };

  const assignFirstStep = (port: BaseModels.BasePort) => {
    if (port.target && port.target in nodeToFirstStepMap) {
      return { ...port, target: nodeToFirstStepMap[port.target] };
    }

    return port;
  };

  const assignAll = Utils.functional.compose(assignFirstStep, assignNextStep);

  // extract stepData without ports for typings
  const { ports, portsV2, ...stepData } = step.data;

  if (ports) {
    return {
      ...step,
      data: {
        ...stepData,
        ports: ports.map(assignAll) as BaseModels.BasePortList,
      },
    };
  }

  if (portsV2) {
    const { dynamic = [], builtIn = {}, byKey = {} } = portsV2;
    return {
      ...step,
      data: {
        ...stepData,
        portsV2: {
          dynamic: dynamic.map(assignAll) as BaseModels.BasePortList,
          builtIn: Utils.object.mapValue(builtIn, assignAll),
          // only assign first step for byKey
          byKey: Utils.object.mapValue(byKey, (port) => assignFirstStep(port!)),
        },
      },
    };
  }

  return step;
};

export const isNodeWithSteps = (node: BaseModels.BaseDiagramNode): node is BaseModels.BaseBlock | BaseModels.BaseActions => {
  return Array.isArray(node.data.steps) && node.data.steps.length > 0;
};

export const isStep = <S extends BaseModels.AnyBaseStep = BaseModels.AnyBaseStep>(node: BaseModels.BaseDiagramNode): node is S => {
  return Array.isArray(node.data.ports) || !!node.data.portsV2;
};

export const getSteps = <S extends BaseModels.AnyBaseStep = BaseModels.AnyBaseStep>(diagram: BaseModels.Diagram.Model) => {
  const steps: S[] = [];

  const nodeToFirstStepMap: Record<string, string> = {};
  const nodeStepsMap: Record<string, string> = {};

  Object.values(diagram.nodes).forEach((node) => {
    if (isNodeWithSteps(node)) {
      [nodeToFirstStepMap[node.nodeID]] = node.data.steps;

      for (let i = 1; i < node.data.steps.length; i++) {
        nodeStepsMap[node.data.steps[i - 1]] = node.data.steps[i];
      }
    }

    if (isStep<S>(node)) {
      steps.push(node);
    }
  });

  return new Map(
    steps.map((step) => {
      const _step = assignStepPorts({
        step,
        nodeToFirstStepMap,
        nodeStepsMap,
      });

      return [_step.nodeID, _step];
    })
  );
};
