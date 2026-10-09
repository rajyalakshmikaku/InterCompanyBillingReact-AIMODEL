import React, { Fragment } from "react";
import "./StatusPipeline.css";

/**
 * Status track — the same design as the invoice approval pipeline,
 * reusable across list screens.
 *
 *   stages        [{ key, label, color, hint }]  the nodes, left to right
 *   items         the rows currently on screen (already filtered)
 *   getKey        (item) => stage key, decides which node an item is counted in
 *
 * Optional:
 *   title         heading shown above the track
 *   subtitle      hint line under the heading
 *   showTotal     render the total-count badge on the right
 *   activeKey     stage currently used as a filter, highlighted
 *   onStageClick  (key) => void — makes the nodes clickable
 *
 * Counts follow whatever filters the screen has applied, so narrowing the list
 * down to a single record lights up the stage that record sits in. Pass the
 * list *before* the stage filter is applied so the other counts stay visible.
 */
const StatusPipeline = ({
    stages = [],
    items = [],
    getKey,
    title,
    subtitle,
    showTotal = false,
    activeKey = null,
    onStageClick,
    totalCount,
    countOverrides,
}) => {
    const isInteractive = typeof onStageClick === "function";

    const counts = items.reduce((acc, item) => {
        const key = getKey(item);
        acc[key] = (acc[key] || 0) + 1;
        return acc;
    }, {});

    const displayedCounts = countOverrides ? { ...counts, ...countOverrides } : counts;

    // The total is the lifecycle's own count, not `items.length`: a stage
    // flagged `excludeFromTotal` (Proforma) is reported next to the track
    // rather than inside it, and rows that resolve to a stage this track does
    // not render are not part of it either.
    const rowTotal = stages
        .filter((stage) => !stage.excludeFromTotal)
        .reduce((sum, stage) => sum + (displayedCounts[stage.key] || 0), 0);
    const total = Number.isFinite(totalCount) ? totalCount : rowTotal;

    // Only auto-highlight when the user has not picked a stage themselves.
    const focusedKey = !activeKey && total === 1 ? getKey(items[0]) : null;
    const activeStage = stages.find((stage) => stage.key === activeKey);

    const renderNode = (stage) => {
        const count = displayedCounts[stage.key] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const isActive = activeKey === stage.key;
        const isFocused = focusedKey === stage.key;

        const handleClick = isInteractive ? () => onStageClick(stage.key) : undefined;

        return (
            <div
                key={stage.key}
                className={[
                    "sp-node",
                    `stage-${stage.key}`,
                    isInteractive ? "is-clickable" : "",
                    isActive ? "is-active" : "",
                    isFocused ? "is-focused" : "",
                ].filter(Boolean).join(" ")}
                title={isInteractive ? `${stage.hint} — click to filter` : stage.hint}
                style={isActive || isFocused ? { borderColor: stage.color } : undefined}
                onClick={handleClick}
                role={isInteractive ? "button" : undefined}
                tabIndex={isInteractive ? 0 : undefined}
                onKeyDown={
                    isInteractive
                        ? (event) => {
                            if (event.key === "Enter" || event.key === " ") {
                                event.preventDefault();
                                onStageClick(stage.key);
                            }
                        }
                        : undefined
                }
            >
                <div
                    className="sp-badge"
                    style={{ background: `${stage.color}15`, borderColor: `${stage.color}40` }}
                >
                    <span className="sp-num" style={{ color: stage.color }}>{count}</span>
                </div>

                <div className="sp-meta">
                    <span className="sp-label">{stage.label}</span>
                    <span className="sp-pct" style={{ color: stage.color }}>{pct}%</span>
                </div>

                <div className="sp-track">
                    <div
                        className="sp-fill"
                        style={{
                            width: `${pct}%`,
                            background: `linear-gradient(90deg, ${stage.color}cc, ${stage.color})`,
                        }}
                    />
                </div>
            </div>
        );
    };

    const renderArrow = (key) => (
        <div className="sp-connector" key={key}>
            <div className="sp-line" />
            <svg className="sp-arrow" width="11" height="11" viewBox="0 0 24 24" fill="none">
                <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="#94a3b8"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />
            </svg>
            <div className="sp-line" />
        </div>
    );

    return (
        <div className="sp-card">
            {(title || subtitle || showTotal) && (
                <div className="sp-header">
                    <div className="sp-header-text">
                        {title && <h3 className="sp-title">{title}</h3>}
                        {subtitle && <p className="sp-sub">{subtitle}</p>}
                    </div>

                    <div className="sp-header-right">
                        {activeStage && (
                            <button
                                type="button"
                                className="sp-active-chip"
                                style={{
                                    background: `${activeStage.color}12`,
                                    borderColor: `${activeStage.color}55`,
                                    color: activeStage.color,
                                }}
                                onClick={() => onStageClick(activeStage.key)}
                                title="Clear this stage filter"
                            >
                                {activeStage.label}
                                <span className="sp-active-chip-count">
                                    {displayedCounts[activeStage.key] || 0}
                                </span>
                                <span className="sp-active-chip-x">✕</span>
                            </button>
                        )}

                        {showTotal && (
                            <div className="sp-total-badge">
                                <span className="sp-total-num">{total}</span>
                                <span className="sp-total-lbl">total</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <div className="sp-flow">
                {stages.map((stage, i) => (
                    <Fragment key={stage.key}>
                        
                        {renderNode(stage)}
                    </Fragment>
                ))}
            </div>
        </div>
    );
};

export default StatusPipeline;
