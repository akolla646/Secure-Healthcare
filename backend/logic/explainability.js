/**
 * Explainability Layer
 * Generates human-readable reasoning paths for all clinical decisions
 */

class ExplainabilityEngine {
    constructor() {
        this.reasoningPaths = [];
        this.ruleCounter = 400; // Start rule numbering at 400
    }

    /**
     * Reset reasoning paths for a new care plan generation
     */
    reset() {
        this.reasoningPaths = [];
        this.ruleCounter = 400;
    }

    /**
     * Add a reasoning step
     * @param {string} category - Category: 'inclusion', 'exclusion', 'dietary', 'monitoring', 'warning'
     * @param {string} reason - Human-readable explanation
     * @param {Object} context - Additional context data
     */
    addReasoning(category, reason, context = {}) {
        const ruleId = `Rule #${this.ruleCounter++}`;
        const timestamp = new Date().toISOString();

        this.reasoningPaths.push({
            ruleId,
            category,
            reason,
            context,
            timestamp
        });

        return ruleId;
    }

    /**
     * Add treatment inclusion reasoning
     */
    addTreatmentInclusion(treatment, diagnosis, priority) {
        return this.addReasoning(
            'inclusion',
            `Recommending ${treatment} for ${diagnosis} (Priority: ${priority})`,
            { treatment, diagnosis, priority, action: 'INCLUDE' }
        );
    }

    /**
     * Add treatment exclusion reasoning (due to allergy)
     */
    addAllergyExclusion(treatment, allergy) {
        return this.addReasoning(
            'exclusion',
            `EXCLUDED ${treatment} due to patient allergy: ${allergy}`,
            { treatment, allergy, action: 'EXCLUDE', reason: 'ALLERGY' }
        );
    }

    /**
     * Add treatment exclusion reasoning (due to contraindication)
     */
    addContraindicationExclusion(treatment, condition) {
        return this.addReasoning(
            'exclusion',
            `EXCLUDED ${treatment} - contraindicated with patient condition: ${condition}`,
            { treatment, condition, action: 'EXCLUDE', reason: 'CONTRAINDICATION' }
        );
    }

    /**
     * Add dietary recommendation reasoning
     */
    addDietaryRecommendation(diet, diagnosis, description) {
        return this.addReasoning(
            'dietary',
            `Recommending "${diet}" - ${description}`,
            { diet, diagnosis, action: 'RECOMMEND_DIET' }
        );
    }

    /**
     * Add lab-based reasoning
     */
    addLabBasedReasoning(labName, value, threshold, recommendation) {
        return this.addReasoning(
            'lab_finding',
            `${labName} = ${value} (threshold: ${threshold}) → ${recommendation}`,
            { labName, value, threshold, recommendation, action: 'LAB_BASED_DECISION' }
        );
    }

    /**
     * Add monitoring requirement
     */
    addMonitoringRequirement(parameter, reason) {
        return this.addReasoning(
            'monitoring',
            `Requires monitoring: ${parameter} - ${reason}`,
            { parameter, action: 'MONITOR' }
        );
    }

    /**
     * Add warning/caution
     */
    addWarning(warning, severity = 'moderate') {
        return this.addReasoning(
            'warning',
            `⚠️ ${severity.toUpperCase()}: ${warning}`,
            { warning, severity, action: 'WARNING' }
        );
    }

    /**
     * Get all reasoning paths
     */
    getReasoningPaths() {
        return this.reasoningPaths;
    }

    /**
     * Get formatted reasoning summary
     */
    getFormattedSummary() {
        const summary = {
            totalRules: this.reasoningPaths.length,
            byCategory: {},
            paths: this.reasoningPaths
        };

        // Group by category
        this.reasoningPaths.forEach(path => {
            if (!summary.byCategory[path.category]) {
                summary.byCategory[path.category] = [];
            }
            summary.byCategory[path.category].push(path);
        });

        return summary;
    }
}

module.exports = ExplainabilityEngine;
