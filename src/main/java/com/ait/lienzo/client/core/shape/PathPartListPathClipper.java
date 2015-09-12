/*
   Copyright (c) 2014,2015 Ahome' Innovation Technologies. All rights reserved.

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
 */

package com.ait.lienzo.client.core.shape;

import com.ait.lienzo.client.core.Context2D;
import com.ait.lienzo.client.core.types.PathPartList;
import com.ait.lienzo.client.core.types.PathPartList.PathPartListJSO;

public final class PathPartListPathClipper extends AbstractPathClipper
{
    private static final long  serialVersionUID = -7616399404882880538L;

    private final PathPartList m_path;

    public PathPartListPathClipper(final PathClipperJSO clip)
    {
        super(clip);

        if (null == getValue())
        {
            m_path = null;
        }
        else
        {
            m_path = new PathPartList((PathPartListJSO) getValue().cast(), true);
        }
    }

    public PathPartListPathClipper(final PathPartList path)
    {
        this(PathClipperJSO.make(path));
    }

    public PathPartListPathClipper(final Shape<?> shape)
    {
        this(shape.getPathPartList());
    }

    @Override
    protected final boolean apply(final Context2D context)
    {
        if (null != m_path)
        {
            context.beginPath();

            final boolean fill = context.clip(m_path);

            if (fill)
            {
                context.clip();
            }
            return fill;
        }
        return false;
    }
}
