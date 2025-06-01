import { NodeHandleConfiguration } from "../../types/handleTypes";

export const restNodeConfig: NodeHandleConfiguration = {
    nodeType: 'restnode',
    category: 'integration',
    handles: [
        {
            position: 'left',
            type: 'target',
            dataFlow: 'data',
            acceptsFrom: ['data'],
            edgeType: 'default',
            icon: 'arrow-right',
        },
        {
            position: 'right',
            type: 'source',
            dataFlow: 'data',
            connectsTo: ['view', 'data', 'logic'],
            icon: 'arrow-right',
            edgeType: "package"
        }
    ]
};