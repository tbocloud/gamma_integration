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
    
    frm.add_custom_button(__('Link Existing Proposals'), function() {
        link_existing_proposals(frm);
    }, __('Gamma'));
    
    // Add test button to verify API is working
    frm.add_custom_button(__('Test API'), function() {
        frappe.call({
            method: 'gamma_integration.gamma_integration.api.test_connection',
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    frappe.show_alert({
                        message: r.message.message || 'API test successful',
                        indicator: 'green'
                    });
                } else {
                    frappe.show_alert({
                        message: 'API test failed',
                        indicator: 'red'
                    });
                }
            },
            error: function(r) {
                frappe.show_alert({
                    message: 'API connection failed',
                    indicator: 'red'
                });
                console.error('API Test Error:', r);
            }
        });
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
                    if (r.message && r.message.status === 'success') {
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
                                },
                                callback: function(sync_r) {
                                    if (sync_r.message && sync_r.message.status === 'success') {
                                        frappe.show_alert({
                                            message: 'URL synced successfully',
                                            indicator: 'green'
                                        });
                                    }
                                }
                            });
                        }
                        
                        frm.reload_doc();
                    } else if (r.message && r.message.status === 'error') {
                        frappe.show_alert({
                            message: r.message.message || 'Error creating proposal',
                            indicator: 'red'
                        });
                    } else {
                        frappe.show_alert({
                            message: 'Unexpected response format',
                            indicator: 'orange'
                        });
                    }
                },
                error: function(r) {
                    frappe.show_alert({
                        message: 'Error creating proposal. Check console for details.',
                        indicator: 'red'
                    });
                    console.error('API Error:', r);
                }
            });
            dialog.hide();
        }
    });
    
    dialog.show();
}

function display_gamma_proposals(frm) {
    console.log('Displaying Gamma proposals...', frm.doc.gamma_proposals);
    
    // Use child table data if available, otherwise fall back to API
    if (frm.doc.gamma_proposals && frm.doc.gamma_proposals.length > 0) {
        let html = generate_proposals_html_from_table(frm.doc.gamma_proposals);
        frm.set_df_property('gamma_proposals_display', 'options', html);
        frm.refresh_field('gamma_proposals_display');
    } else {
        // Fallback to API call for backward compatibility
        frappe.call({
            method: 'gamma_integration.gamma_integration.api.get_quotation_proposals',
            args: {
                quotation_name: frm.doc.name
            },
            callback: function(r) {
                if (r.message && r.message.status === 'success') {
                    let proposals = r.message.proposals || [];
                    if (proposals.length === 0) {
                        show_empty_state(frm);
                    } else {
                        let html = generate_proposals_html(proposals);
                        frm.set_df_property('gamma_proposals_display', 'options', html);
                        frm.refresh_field('gamma_proposals_display');
                    }
                } else {
                    show_empty_state(frm);
                }
            },
            error: function(r) {
                console.error('Error in get_quotation_proposals:', r);
                show_empty_state(frm);
            }
        });
    }
}

function show_empty_state(frm) {
    let empty_html = `
        <div style="text-align: center; padding: 40px; background: #f8f9fa; border-radius: 8px; margin: 15px 0;">
            <div style="font-size: 48px; color: #6c757d; margin-bottom: 15px;">📋</div>
            <h5 style="color: #6c757d; margin-bottom: 10px;">No Gamma Proposals</h5>
            <p style="color: #adb5bd; margin-bottom: 20px;">Click "Create Gamma Proposal" to add interactive presentations</p>
            <button class="btn btn-primary btn-sm" onclick="frappe.ui.form.get_open_form().dashboard.add_custom_button_action('Create Gamma Proposal')">
                + Create First Proposal
            </button>
        </div>
    `;
    frm.set_df_property('gamma_proposals_display', 'options', empty_html);
    frm.refresh_field('gamma_proposals_display');
}

function generate_proposals_html_from_table(proposals_table) {
    let html = '<div class="gamma-proposals-container" style="margin: 20px 0;">';
    html += '<h5 style="margin-bottom: 20px; color: #495057; border-bottom: 2px solid #e9ecef; padding-bottom: 10px;">📊 Interactive Presentations</h5>';
    
    proposals_table.forEach((proposal_link, index) => {
        // Get the actual Gamma Proposal document data
        let primary_badge = proposal_link.is_primary ? '<span class="badge badge-success" style="margin-left: 8px;">Primary</span>' : '';
        let status_color = get_status_color(proposal_link.status || 'Draft');
        
        html += `
            <div class="gamma-proposal-card" style="margin-bottom: 25px; border: 1px solid #dee2e6; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); padding: 15px; border-bottom: 1px solid #dee2e6;">
                    <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap;">
                        <div style="flex: 1;">
                            <h6 style="margin: 0 0 5px 0; color: #212529;">
                                ${proposal_link.gamma_proposal || 'Proposal ' + (index + 1)}
                                ${primary_badge}
                            </h6>
                            <small style="color: #6c757d;">
                                ${proposal_link.proposal_type || 'Main'} Proposal •
                                <span class="badge badge-${status_color}">${proposal_link.status || 'Draft'}</span>
                            </small>
                        </div>
                        <div style="margin-top: 10px;">
                            <button class="btn btn-sm btn-outline-secondary" onclick="open_gamma_editor('${proposal_link.gamma_proposal}')" style="margin-right: 8px;">
                                ✏️ Edit
                            </button>
                            <button class="btn btn-sm btn-outline-primary" onclick="open_gamma_share('${proposal_link.gamma_proposal}')">
                                🔗 Share
                            </button>
                        </div>
                    </div>
                </div>
                
                <!-- Embedded Presentation -->
                <div style="position: relative; background: #f8f9fa;">
                    <div id="gamma-embed-${index}" style="min-height: 500px; display: flex; align-items: center; justify-content: center;">
                        <div style="text-align: center; color: #6c757d;">
                            <div style="font-size: 24px; margin-bottom: 10px;">⏳</div>
                            <div>Loading presentation...</div>
                            <small style="display: block; margin-top: 10px;">
                                <a href="#" onclick="load_gamma_embed('${proposal_link.gamma_proposal}', ${index})" class="text-primary">
                                    Click to load presentation
                                </a>
                            </small>
                        </div>
                    </div>
                </div>
                
            </div>
        `;
    });
    
    html += '</div>';
    
    // Add script to auto-load first presentation
    html += `
        <script>
            setTimeout(function() {
                if (typeof load_gamma_embed === 'function') {
                    load_gamma_embed('${proposals_table[0]?.gamma_proposal}', 0);
                }
            }, 1000);
        </script>
    `;
    
    return html;
}

function generate_proposals_html(proposals) {
    let html = '<div class="gamma-proposals-container">';
    
    proposals.forEach((proposal) => {
        let primary_badge = proposal.is_primary ? '<span class="badge badge-success">Primary</span>' : '';
        
        html += `
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
                            ${proposal.gamma_embed_id ? `
                                <a href="https://gamma.app/docs/${proposal.gamma_embed_id}" target="_blank" 
                                   class="btn btn-sm btn-outline-secondary" style="margin-right: 8px;">
                                    ✏️ Edit
                                </a>
                                <a href="https://gamma.app/public/${proposal.gamma_embed_id}" target="_blank" 
                                   class="btn btn-sm btn-outline-primary">
                                    🔗 Share
                                </a>
                            ` : `
                                <small class="text-muted">No embed ID available</small>
                            `}
                        </div>
                    </div>
                </div>
                ${proposal.gamma_embed_id ? `
                    <div class="proposal-content">
                        <iframe src="https://gamma.app/embed/${proposal.gamma_embed_id}" 
                                style="width: 100%; height: 500px; border: none;" 
                                allowfullscreen 
                                title="${proposal.proposal_name}">
                        </iframe>
                    </div>
                ` : `
                    <div class="proposal-content" style="padding: 20px; text-align: center;">
                        <p class="text-muted">Proposal created but not yet synced with Gamma</p>
                        <small>Use "Sync All Proposals" to update from Gamma</small>
                    </div>
                `}
            </div>
        `;
    });
    
    html += '</div>';
    return html;
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
// Helper functions for Gamma embed loading and interaction
function load_gamma_embed(proposal_name, index) {
    if (!proposal_name) {
        console.error('No proposal name provided');
        return;
    }
    
    // Get the Gamma Proposal document to fetch the embed ID
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                let embed_id = r.message.gamma_embed_id;
                let container = document.getElementById(`gamma-embed-${index}`);
                
                if (container) {
                    container.innerHTML = `
                        <iframe src="https://gamma.app/embed/${embed_id}" 
                                style="width: 100%; height: 500px; border: none; opacity: 0; transition: opacity 0.3s;" 
                                allowfullscreen 
                                title="${r.message.proposal_name || 'Gamma Proposal'}"
                                onload="this.style.opacity=1">
                        </iframe>
                    `;
                }
            } else {
                let container = document.getElementById(`gamma-embed-${index}`);
                if (container) {
                    container.innerHTML = `
                        <div style="text-align: center; padding: 40px; color: #6c757d;">
                            <div style="font-size: 24px; margin-bottom: 10px;">⚠️</div>
                            <div>No embed ID available</div>
                            <small style="display: block; margin-top: 10px;">
                                Please sync this proposal with Gamma
                            </small>
                        </div>
                    `;
                }
            }
        },
        error: function(r) {
            console.error('Error loading Gamma proposal:', r);
            let container = document.getElementById(`gamma-embed-${index}`);
            if (container) {
                container.innerHTML = `
                    <div style="text-align: center; padding: 40px; color: #dc3545;">
                        <div style="font-size: 24px; margin-bottom: 10px;">❌</div>
                        <div>Error loading proposal</div>
                    </div>
                `;
            }
        }
    });
}

function open_gamma_editor(proposal_name) {
    if (!proposal_name) {
        frappe.show_alert({
            message: 'No proposal selected',
            indicator: 'red'
        });
        return;
    }
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                let edit_url = `https://gamma.app/docs/${r.message.gamma_embed_id}`;
                window.open(edit_url, '_blank');
            } else {
                frappe.show_alert({
                    message: 'No Gamma URL available for this proposal',
                    indicator: 'orange'
                });
            }
        }
    });
}

function open_gamma_share(proposal_name) {
    if (!proposal_name) {
        frappe.show_alert({
            message: 'No proposal selected',
            indicator: 'red'
        });
        return;
    }
    
    frappe.call({
        method: 'frappe.client.get',
        args: {
            doctype: 'Gamma Proposal',
            name: proposal_name
        },
        callback: function(r) {
            if (r.message && r.message.gamma_embed_id) {
                let share_url = `https://gamma.app/public/${r.message.gamma_embed_id}`;
                window.open(share_url, '_blank');
            } else {
                frappe.show_alert({
                    message: 'No Gamma URL available for this proposal',
                    indicator: 'orange'
                });
            }
        }
    });
}

// Auto-refresh display when child table changes
frappe.ui.form.on('Quotation Gamma Proposal', {
    gamma_proposal: function(frm, cdt, cdn) {
        // Refresh display when proposal is linked
        setTimeout(() => {
            display_gamma_proposals(frm);
        }, 500);
    },
    
    status: function(frm, cdt, cdn) {
        // Refresh display when status changes
        display_gamma_proposals(frm);
    },
    
    is_primary: function(frm, cdt, cdn) {
        // Refresh display when primary status changes
        display_gamma_proposals(frm);
    }
});
function link_existing_proposals(frm) {
    frappe.show_alert({
        message: 'Linking existing Gamma proposals...',
        indicator: 'blue'
    });
    
    frappe.call({
        method: 'gamma_integration.gamma_integration.api.link_existing_proposals',
        callback: function(r) {
            if (r.message && r.message.status === 'success') {
                frappe.show_alert({
                    message: r.message.message,
                    indicator: 'green'
                });
                
                // Refresh the form to show newly linked proposals
                frm.reload_doc();
            } else {
                frappe.show_alert({
                    message: r.message?.message || 'Error linking proposals',
                    indicator: 'red'
                });
            }
        },
        error: function(r) {
            frappe.show_alert({
                message: 'Error linking existing proposals',
                indicator: 'red'
            });
            console.error('Link Existing Proposals Error:', r);
        }
    });
}