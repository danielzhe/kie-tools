/*
 * Copyright 2016 Red Hat, Inc. and/or its affiliates.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.kie.workbench.common.stunner.bpmn.definition;

import java.util.HashSet;
import java.util.Set;
import javax.validation.Valid;

import org.jboss.errai.common.client.api.annotations.MapsTo;
import org.jboss.errai.common.client.api.annotations.NonPortable;
import org.kie.workbench.common.forms.adf.definitions.annotations.FormField;
import org.kie.workbench.common.stunner.bpmn.definition.property.background.BackgroundSet;
import org.kie.workbench.common.stunner.bpmn.definition.property.dataio.DataIOModel;
import org.kie.workbench.common.stunner.bpmn.definition.property.dimensions.CircleDimensionSet;
import org.kie.workbench.common.stunner.bpmn.definition.property.font.FontSet;
import org.kie.workbench.common.stunner.bpmn.definition.property.general.BPMNGeneralSet;
import org.kie.workbench.common.stunner.core.definition.annotation.PropertySet;
import org.kie.workbench.common.stunner.core.definition.annotation.definition.Category;
import org.kie.workbench.common.stunner.core.definition.annotation.definition.Labels;
import org.kie.workbench.common.stunner.core.definition.annotation.morph.MorphBase;
import org.kie.workbench.common.stunner.core.definition.builder.Builder;

@MorphBase(defaultType = IntermediateTimerEvent.class)
public abstract class BaseIntermediateEvent implements BPMNDefinition,
                                                       DataIOModel {

    @Category
    public static final transient String category = Categories.EVENTS;

    @PropertySet
    @FormField
    @Valid
    protected BPMNGeneralSet general;

    @PropertySet
    @Valid
    protected BackgroundSet backgroundSet;

    @PropertySet
    protected FontSet fontSet;

    @PropertySet
    protected CircleDimensionSet dimensionsSet;

    @Labels
    private final Set<String> labels = new HashSet<String>() {{
        add("all");
        add("sequence_start");
        add("sequence_end");
        add("to_task_event");
        add("from_task_event");
        add("fromtoall");
        add("FromEventbasedGateway");
        add("IntermediateEventOnSubprocessBoundary");
        add("IntermediateEventOnActivityBoundary");
        add("EventOnChoreographyActivityBoundary");
        add("IntermediateEventsMorph");
    }};

    @NonPortable
    static abstract class BaseIntermediateEventBuilder<T extends BaseIntermediateEvent> implements Builder<T> {

        public static final String BG_COLOR = "#FFFFFF";
        public static final Double BORDER_SIZE = 4d;
        public static final String BORDER_COLOR = "#000000";
        public static final Double RADIUS = 14d;
    }

    public BaseIntermediateEvent() {
    }

    public BaseIntermediateEvent(final @MapsTo("general") BPMNGeneralSet general,
                                 final @MapsTo("backgroundSet") BackgroundSet backgroundSet,
                                 final @MapsTo("fontSet") FontSet fontSet,
                                 final @MapsTo("dimensionsSet") CircleDimensionSet dimensionsSet) {
        this.general = general;
        this.backgroundSet = backgroundSet;
        this.fontSet = fontSet;
        this.dimensionsSet = dimensionsSet;
    }

    @Override
    public boolean hasInputVars() {
        return true;
    }

    @Override
    public boolean isSingleInputVar() {
        return true;
    }

    @Override
    public boolean hasOutputVars() {
        return true;
    }

    @Override
    public boolean isSingleOutputVar() {
        return false;
    }

    public String getCategory() {
        return category;
    }

    public BPMNGeneralSet getGeneral() {
        return general;
    }

    public void setGeneral(BPMNGeneralSet general) {
        this.general = general;
    }

    public BackgroundSet getBackgroundSet() {
        return backgroundSet;
    }

    public void setBackgroundSet(BackgroundSet backgroundSet) {
        this.backgroundSet = backgroundSet;
    }

    public FontSet getFontSet() {
        return fontSet;
    }

    public void setFontSet(FontSet fontSet) {
        this.fontSet = fontSet;
    }

    public CircleDimensionSet getDimensionsSet() {
        return dimensionsSet;
    }

    public void setDimensionsSet(CircleDimensionSet dimensionsSet) {
        this.dimensionsSet = dimensionsSet;
    }

    public Set<String> getLabels() {
        return labels;
    }
}
