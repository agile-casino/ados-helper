// @vitest-environment happy-dom

import { test, expect } from "vitest";
import { render } from '@testing-library/react';
import { If } from '../../src/components/If';

test("If_WhenConditionIsFalse_DoesNotRenderChild", () => {
    const result = render(
        <If condition={true}>
            <div data-testid="test-div"></div>
        </If>
    )

    expect(result.queryAllByTestId("test-div").length).toEqual(1);
});

test("If_WhenConditionIsFalse_DoesNotRenderChild", () => {
    const result = render(
        <If condition={false}>
            <div data-testid="test-div"></div>
        </If>
    )

    expect(result.queryAllByTestId("test-div").length).toEqual(0);
});