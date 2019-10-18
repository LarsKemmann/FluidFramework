/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { IComponent, IComponentLoadable, IResponse } from "@microsoft/fluid-component-core-interfaces";
import { IHostRuntime } from "@microsoft/fluid-runtime-definitions";
import { RequestParser } from "./requestParser";

/**
 * A request handler for the contianer runtime. Each handler should handle a specific request, and return undefined
 * if it does not apply. These handlers are called in series, so there may be other handlers before or after.
 * A handler should only return error if the request is for a route the handler owns, and there is a problem with
 * the route, or fulling the specific request.
 */
export type RuntimeRequestHandler = (request: RequestParser, runtime: IHostRuntime) => Promise<IResponse | undefined>;

export const componentRuntimeRequestHandler: RuntimeRequestHandler =
    async (request: RequestParser, runtime: IHostRuntime) => {

        if (request.pathParts.length > 0) {
            let wait: boolean | undefined;
            if (request.headers && (typeof request.headers.wait) === "boolean") {
                wait = request.headers.wait as boolean;
            }

            const component = await runtime.getComponentRuntime(request.pathParts[0], wait);

            return component.request(request.createSubRequest(1));
        }
        return undefined;
    };

export function createComponentResponse(component: IComponent) {
    return { status: 200, mimeType: "fluid/component", value: component };
}

export function createLoadableComponentRuntimeRequestHandler(component: IComponentLoadable): RuntimeRequestHandler {
    const pathParts = RequestParser.getPathParts(component.url);
    return async (request: RequestParser, runtime: IHostRuntime) => {
        for (let i = 0; i < pathParts.length; i++) {
            if (pathParts[i] !== request.pathParts[i]) {
                return undefined;
            }
        }
        return createComponentResponse(component);
    };
}

export const serviceRoutePathRoot = "_services";
export function createServiceRuntimeRequestHandler(
    serviceId: string, component: IComponent): RuntimeRequestHandler {
    return async (request: RequestParser, runtime: IHostRuntime) => {
        if (request.pathParts.length >= 2
            && request.pathParts[0] === serviceRoutePathRoot
            && request.pathParts[1] === serviceId) {

            if (request.pathParts.length === 2) {
                return createComponentResponse(component);
            }

            if (component.IComponentRouter) {
                return component.IComponentRouter.request(request.createSubRequest(2));
            }

            return { status: 400, mimeType: "text/plain", value: `${request.url} service is not a router` };
        }

        return undefined;
    };
}
