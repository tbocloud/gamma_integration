// Global Gamma Integration functions

frappe.ui.form.on('Quotation', {
    refresh: function(frm) {
        add_gamma_buttons(frm);
        display_gamma_proposals(frm);
    },
    
    gamma_proposals: function(frm) {
        display_gamma_proposals(frm);
    }
});

function add_gamma_buttons(frm) {
    // Add custom buttons for Gamma integration
    frm.add_custom_button(__('Create Gamma Proposal'), function() {
        create_gamma_proposal_dialog(frm);
    }, __('Gamma'));
    
    frm.add_custom_button(__('Sync All Proposals'), function() {
        sync_all_gamma_proposals(frm);
    }, __('Gamma'));
}

function create_gamma_proposal_dialog(frm) {
    let dialog = new frappe.ui.Dialog({
        title: 'Create Gamma Proposal',
        fields: [
            {
                fieldname: 'proposal_name',
                fieldtype: 'Data',
                label: 'Proposal Name',
                reqd: 1,
                default: `Proposal for ${frm.doc.customer || 'Customer'}`
            },
            {
                fieldname: 'proposal_type',
                fieldtype: 'Select',
                label: 'Proposal Type',
                options: 'Main Proposal\nTechnical Proposal\nFinancial Proposal\nExecutive Summary',
                default: 'Main Proposal'
            },
            {
                fieldname: 'gamma_url',
                fieldtype: 'Data',
                label: 'Gamma URL (Optional)',
                description: 'Paste existing Gamma presentation URL'
            }
        ],
        primary_action_label: 'Create',
        primary_action(values) {
            frappe.call({
                method: 'gamma_integration.gamma_integration.api.create_gamma_proposal',
                args: {
                    quotation_name: frm.doc.name,
                    proposal_name: values.proposal_name,
                    proposal_type: values.proposal_type
                },
                callback: function(r) {
                    if (r.message.status === 'success') {
                        frappe.show_alert({
                            message: r.message.message,
                            indicator: 'green'
                        });
                        
                        // If URL provided, sync it
                        if (values.gamma_url) {
                            frappe.call({
                                method: 'gamma_integration.gamma_integration.api.sync_gamma_data',
                                args: {
                                    gamma_proposal_name: r.message.gamma_proposal,
                                    gamma_url: values.gamma_url
                                }
                            });
                        }
                        
                        frm.reload_doc();
                    }
                }
            });
            dialog.hide();
        }
    });
    
    dialog.show();
}

function display_gamma_proposals(frm) {
    if (!frm.doc.gamma_proposals || frm.doc.gamma_proposals.length === 0) {
        frm.set_df_property('gamma_proposals_display', 'options', 
            '<div class="text-center text-muted" style="padding: 40px;">No Gamma proposals linked</div>'
        );
        frm.refresh_field('gamma_proposals_display');
        return;
    }
    
    let html = '<div class="gamma-proposals-container">';
    
    frm.doc.gamma_proposals.forEach((proposal_link, index) => {
        // Get full proposal details
        frappe.call({
            method: 'frappe.client.get',
            args: {
                doctype: 'Gamma Proposal',
                name: proposal_link.gamma_proposal
            },
            callback: function(r) {
                if (r.message) {
                    let proposal = r.message;
                    if (proposal.gamma_embed_id) {
                        html += generate_proposal_html(proposal, proposal_link.is_primary);
                    }
                }
                
                // Update display after last proposal
                if (index === frm.doc.gamma_proposals.length - 1) {
                    html += '</div>';
                    frm.set_df_property('gamma_proposals_display', 'options', html);
                    frm.refresh_field('gamma_proposals_display');
                }
            }
        });
    });
}

function generate_proposal_html(proposal, is_primary) {
    let primary_badge = is_primary ? '<span class="badge badge-success">Primary</span>' : '';
    
    return `
        <div class="gamma-proposal-item" style="margin-bottom: 25px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden;">
            <div class="proposal-header" style="background: #f8f9fa; padding: 15px; border-bottom: 1px solid #dee2e6;">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <h6 style="margin: 0;">
                            ${proposal.proposal_name} 
                            ${primary_badge}
                            <span class="badge badge-${get_status_color(proposal.status)}">${proposal.status}</span>
                        </h6>
                        <small class="text-muted">${proposal.proposal_type}</small>
                    </div>
                    <div class="proposal-actions">
                        <a href="https://gamma.app/docs/${proposal.gamma_embed_id}" target="_blank" 
                           class="btn btn-sm btn-outline-secondary" style="margin-right: 8px;">
                            ✏️ Edit
                        </a>
                        <a href="https://gamma.app/public/${proposal.gamma_embed_id}" target="_blank" 
                           class="btn btn-sm btn-outline-primary">
                            🔗 Share
                        </a>
                    </div>
                </div>
            </div>
            <div class="proposal-content">
                <iframe src="https://gamma.app/embed/${proposal.gamma_embed_id}" 
                        style="width: 100%; height: 500px; border: none;" 
                        allowfullscreen 
                        title="${proposal.proposal_name}">
                </iframe>
            </div>
        </div>
    `;
}

function get_status_color(status) {
    const colors = {
        'Draft': 'secondary',
        'In Review': 'warning',
        'Shared': 'info',
        'Approved': 'success',
        'Rejected': 'danger'
    };
    return colors[status] || 'light';
}

function sync_all_gamma_proposals(frm) {
    frappe.show_alert({
        message: 'Syncing all Gamma proposals...',
        indicator: 'blue'
    });
    
    // Refresh the form to sync all proposals
    frm.reload_doc();
}