/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
import React, { useCallback } from "react";
import { EnvelopeServer } from "@kie-tools-core/envelope-bus/dist/channel";
import { EmbeddedEnvelopeProps, RefForwardingEmbeddedEnvelope } from "@kie-tools-core/envelope/dist/embedded";
import { ProcessFormApi, ProcessFormChannelApi, ProcessFormEnvelopeApi } from "../api";
import { init } from "../envelope";
import { ContainerType } from "@kie-tools-core/envelope/dist/api";
import { ProcessDefinition } from "@kie-tools/runtime-tools-process-gateway-api/dist/types";

export interface EmbeddedProcessFormProps {
  targetOrigin: string;
  channelApi: ProcessFormChannelApi;
  processDefinition: ProcessDefinition;
  customFormDisplayerEnvelopePath?: string;
  shouldLoadCustomForms?: boolean;
}

export const EmbeddedProcessForm = React.forwardRef(
  (props: EmbeddedProcessFormProps, forwardedRef: React.Ref<ProcessFormApi>) => {
    const refDelegate = useCallback(
      (envelopeServer: EnvelopeServer<ProcessFormChannelApi, ProcessFormEnvelopeApi>): ProcessFormApi => ({}),
      []
    );
    const pollInit = useCallback(
      async (
        envelopeServer: EnvelopeServer<ProcessFormChannelApi, ProcessFormEnvelopeApi>,
        container: () => HTMLDivElement
      ) => {
        await init({
          config: {
            containerType: ContainerType.DIV,
            envelopeId: envelopeServer.id,
          },
          container: container(),
          bus: {
            postMessage(message, targetOrigin, transfer) {
              window.postMessage(message, targetOrigin!, transfer);
            },
          },
          targetOrigin: props.targetOrigin,
          customFormDisplayerEnvelopePath: props.customFormDisplayerEnvelopePath,
          shouldLoadCustomForms: props.shouldLoadCustomForms,
        });
        return envelopeServer.envelopeApi.requests.processForm__init(
          {
            origin: envelopeServer.origin,
            envelopeServerId: envelopeServer.id,
          },
          { ...props.processDefinition }
        );
      },
      [props.customFormDisplayerEnvelopePath, props.processDefinition, props.targetOrigin, props.shouldLoadCustomForms]
    );

    return (
      <EmbeddedProcessFormEnvelope
        ref={forwardedRef}
        apiImpl={props.channelApi}
        origin={props.targetOrigin}
        refDelegate={refDelegate}
        pollInit={pollInit}
        config={{ containerType: ContainerType.DIV }}
      />
    );
  }
);

const EmbeddedProcessFormEnvelope = React.forwardRef<
  ProcessFormApi,
  EmbeddedEnvelopeProps<ProcessFormChannelApi, ProcessFormEnvelopeApi, ProcessFormApi>
>(RefForwardingEmbeddedEnvelope);
