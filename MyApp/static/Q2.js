function loadQ2Chart() { 
    d3.select("#chart").html("");
    d3.select("#legend").html("");
    d3.select("#title").html("<h2 style='text-align: center; margin-bottom: 20px;'>Doanh số bán hàng theo Nhóm hàng</h2>"); // 🟢 Thêm tiêu đề

    d3.json("/visualize/").then(function(data) {
        // Nhóm doanh số theo nhóm hàng
        const revenueByGroup = d3.rollup(data, 
            v => ({
                revenue: d3.sum(v, d => +d["Thành tiền"]),
                quantity: d3.sum(v, d => +d["SL"]) // Tổng số lượng bán
            }),
            d => `[${d["Mã nhóm hàng"]}] ${d["Tên nhóm hàng"]}`
        );

        const dataset = Array.from(revenueByGroup, ([group, values]) => ({ 
            group, 
            revenue: values.revenue,
            quantity: values.quantity
        }))
        .sort((a, b) => d3.descending(a.revenue, b.revenue));

        // Thiết lập màu sắc
        const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
            .domain(dataset.map(d => d.group));

        // Kích thước biểu đồ
        const margin = { top: 70, right: 100, bottom: 50, left: 250 }; // 🟢 Tăng margin.top để chừa chỗ tiêu đề
        const width = 1000 - margin.left - margin.right;
        const height = dataset.length * 60;

        // Tạo SVG
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

        // 🟢 Thêm tiêu đề trực tiếp trong SVG
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -30) // Dịch lên trên để không bị trùng nội dung
            .attr("text-anchor", "middle")
            .style("font-size", "20px")
            .style("font-weight", "bold")
            .style("fill", "#333")
            .text("Doanh số bán hàng theo Nhóm hàng");

        // Thang đo
        const y = d3.scaleBand()
            .domain(dataset.map(d => d.group))
            .range([0, height])
            .padding(0.2);

        const x = d3.scaleLinear()
            .domain([0, Math.ceil(d3.max(dataset, d => d.revenue) / 100000000) * 100000000])
            .range([0, width]);

        // Trục Y
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0).tickPadding(10))
            .attr("class", "axis-label");

        // Trục X
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => d3.format(".2s")(d).replace(/G/, 'B').replace(/M/, 'M')));

        // Tooltip
        const tooltip = d3.select("body").append("div")
            .style("position", "absolute")
            .style("background", "rgba(0, 0, 0, 0.8)")
            .style("color", "#fff")
            .style("padding", "8px")
            .style("border-radius", "5px")
            .style("font-size", "12px")
            .style("visibility", "hidden");

        // Vẽ cột
        svg.selectAll(".bar")
            .data(dataset)
            .enter()
            .append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.group))
            .attr("width", d => x(d.revenue))
            .attr("height", y.bandwidth())
            .attr("fill", d => colorScale(d.group))
            .on("mouseover", function(event, d) {
                tooltip.style("visibility", "visible")
                    .html(`
                        <strong>Nhóm hàng:</strong> ${d.group}<br>
                        <strong>Doanh số bán:</strong> ${d3.format(",")(d.revenue)} VND<br>
                        <strong>Số lượng bán:</strong> ${d3.format(",")(d.quantity)} SKUs<br>
                    `);
            })
            .on("mousemove", function(event) {
                tooltip.style("top", `${event.pageY - 10}px`)
                    .style("left", `${event.pageX + 10}px`);
            })
            .on("mouseout", function() {
                tooltip.style("visibility", "hidden");
            });

        // Thêm nhãn trên cột
        svg.selectAll(".label")
            .data(dataset)
            .enter()
            .append("text")
            .attr("x", d => x(d.revenue) + 5)
            .attr("y", d => y(d.group) + y.bandwidth() / 2)
            .attr("dy", "0.35em")
            .text(d => d3.format(",.0f")(d.revenue / 1000000) + " triệu VND")
            .style("font-size", "10px")  // 🔥 Giảm kích thước chữ
            .style("fill", "black");
    });
}
